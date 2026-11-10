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

        group.MapPost("/", (
            WhatsAppWebhookPayload payload,
            IServiceScopeFactory scopeFactory,
            ILogger<WhatsAppWebhookEndpoint> logger) =>
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

            return Results.Ok();
        })
        .WithName("ReceiveWhatsAppMessage")
        .WithDescription("Recibe eventos y mensajes entrantes de WhatsApp desde Meta Cloud API.")
        .Produces(StatusCodes.Status200OK);
    }
}

