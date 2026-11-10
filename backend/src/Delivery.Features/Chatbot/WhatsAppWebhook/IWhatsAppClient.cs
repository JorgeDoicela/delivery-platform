namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public interface IWhatsAppClient
{
    Task<bool> SendTextMessageAsync(string recipientPhone, string messageText, string? phoneNumberId = null, CancellationToken ct = default);
    Task MarkMessageAsReadAsync(string messageId, string? phoneNumberId = null, CancellationToken ct = default);
}

