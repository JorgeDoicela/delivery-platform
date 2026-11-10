namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public interface IWhatsAppWebhookProcessor
{
    Task ProcessPayloadAsync(WhatsAppWebhookPayload payload, CancellationToken ct = default);
}

