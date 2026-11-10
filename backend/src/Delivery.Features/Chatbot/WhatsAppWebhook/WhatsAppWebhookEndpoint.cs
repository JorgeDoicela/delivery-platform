using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Delivery.Features.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class WhatsAppWebhookEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/webhooks/whatsapp")
            .WithTags("Chatbot & WhatsApp");

        group.MapGet("/", (
            [FromQuery(Name = "hub.mode")] string? mode,
            [FromQuery(Name = "hub.verify_token")] string? verifyToken,
            [FromQuery(Name = "hub.challenge")] string? challenge,
            IOptions<WhatsAppChatbotOptions> options,
            ILogger<WhatsAppWebhookEndpoint> logger) =>
        {
            logger.LogInformation("Verificando webhook de WhatsApp. Mode: {Mode}", mode);

            var expectedToken = options.Value.VerifyToken;

            if (mode == "subscribe" && !string.IsNullOrWhiteSpace(verifyToken) && verifyToken == expectedToken)
            {
                logger.LogInformation("Webhook de WhatsApp verificado exitosamente por Meta.");
                return Results.Content(challenge ?? string.Empty, "text/plain");
            }

            logger.LogWarning("Fallo en verificación de webhook de WhatsApp. Token recibido: {Token}", verifyToken);
            return Results.Unauthorized();
        })
        .WithName("VerifyWhatsAppWebhook")
        .WithDescription("Verifica el apretón de manos inicial enviado por Meta Cloud API.")
        .Produces(StatusCodes.Status200OK, contentType: "text/plain")
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/", async (
            HttpContext context,
            IServiceScopeFactory scopeFactory,
            IOptions<WhatsAppChatbotOptions> options,
            ILogger<WhatsAppWebhookEndpoint> logger) =>
        {
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8);
            var rawBody = await reader.ReadToEndAsync();

            var signatureHeader = context.Request.Headers["X-Hub-Signature-256"].FirstOrDefault();
            if (!IsValidMetaSignature(rawBody, signatureHeader, options.Value.AppSecret))
            {
                logger.LogWarning("Firma de seguridad HMAC SHA-256 de WhatsApp inválida.");
                return Results.Unauthorized();
            }

            WhatsAppWebhookPayload? payload = null;
            if (!string.IsNullOrWhiteSpace(rawBody))
            {
                try
                {
                    payload = JsonSerializer.Deserialize<WhatsAppWebhookPayload>(rawBody);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error al deserializar payload JSON de WhatsApp.");
                    return Results.BadRequest();
                }
            }

            if (payload != null)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = scopeFactory.CreateScope();
                        var processor = scope.ServiceProvider.GetRequiredService<IWhatsAppWebhookProcessor>();
                        await processor.ProcessPayloadAsync(payload);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Excepción no controlada procesando webhook de WhatsApp en segundo plano.");
                    }
                });
            }

            return Results.Ok();
        })
        .WithName("ReceiveWhatsAppMessage")
        .WithDescription("Recibe eventos y mensajes entrantes de WhatsApp desde Meta Cloud API con validación HMAC SHA-256.")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status400BadRequest);
    }

    public static bool IsValidMetaSignature(string rawBody, string? signatureHeader, string? appSecret)
    {
        if (string.IsNullOrWhiteSpace(appSecret))
        {
            return true; // En desarrollo o si no está configurado, omitir para no romper entornos locales
        }

        if (string.IsNullOrWhiteSpace(signatureHeader) || !signatureHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var expectedHash = signatureHeader["sha256=".Length..];
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(appSecret));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody));
        var computedHash = Convert.ToHexString(hashBytes).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHash),
            Encoding.UTF8.GetBytes(expectedHash.ToLowerInvariant()));
    }
}

