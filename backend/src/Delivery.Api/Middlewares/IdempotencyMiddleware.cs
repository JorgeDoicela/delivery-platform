using System.Text;
using StackExchange.Redis;

namespace Delivery.Api.Middlewares;

public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConnectionMultiplexer _redis;

    public IdempotencyMiddleware(RequestDelegate next, IConnectionMultiplexer redis)
    {
        _next = next;
        _redis = redis;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Solo aplica a creación de órdenes POST /api/orders
        if (context.Request.Method != HttpMethods.Post || !context.Request.Path.StartsWithSegments("/api/orders"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("Idempotency-Key", out var keyValues) || string.IsNullOrWhiteSpace(keyValues))
        {
            await _next(context);
            return;
        }

        string idempotencyKey = $"idempotency:{keyValues.ToString().Trim()}";
        var db = _redis.GetDatabase();

        // Intentar registrar la clave en estado PROCESSING con TTL de 120 segundos
        bool acquired = await db.StringSetAsync(idempotencyKey, "PROCESSING", TimeSpan.FromSeconds(120), When.NotExists);

        if (!acquired)
        {
            var existingValue = await db.StringGetAsync(idempotencyKey);
            if (existingValue == "PROCESSING")
            {
                // Otra solicitud concurrente con la misma clave está en proceso
                context.Response.StatusCode = StatusCodes.Status409Conflict;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"La solicitud ya se encuentra en procesamiento.\"}");
                return;
            }

            // Clave ya procesada: retornar respuesta previa en caché
            if (!existingValue.IsNullOrEmpty)
            {
                context.Response.StatusCode = StatusCodes.Status200OK;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(existingValue.ToString());
                return;
            }
        }

        // Interceptar el Stream de respuesta para almacenar el resultado final
        var originalBodyStream = context.Response.Body;
        using var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;

        try
        {
            await _next(context);

            memoryStream.Seek(0, SeekOrigin.Begin);
            string responseBody = await new StreamReader(memoryStream).ReadToEndAsync();
            memoryStream.Seek(0, SeekOrigin.Begin);

            if (context.Response.StatusCode is >= 200 and < 300)
            {
                // Guardar respuesta exitosa en Redis con TTL de 120 segundos
                await db.StringSetAsync(idempotencyKey, responseBody, TimeSpan.FromSeconds(120));
            }
            else
            {
                // En caso de fallo de validación o error, liberar la clave de idempotencia
                await db.KeyDeleteAsync(idempotencyKey);
            }

            await memoryStream.CopyToAsync(originalBodyStream);
        }
        catch
        {
            await db.KeyDeleteAsync(idempotencyKey);
            throw;
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }
}
