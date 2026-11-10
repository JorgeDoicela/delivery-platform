namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public interface IChatbotAiEngine
{
    Task<string> GenerateReplyAsync(
        string systemPrompt,
        List<ChatMessageDto> history,
        string userMessage,
        string? injectedOrderContext = null,
        CancellationToken ct = default);
}

