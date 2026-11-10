namespace Delivery.Features.Chatbot.WhatsAppWebhook;

/// <summary>
/// Gestiona la persistencia y recuperación del historial conversacional en Redis por cliente y tenant.
/// </summary>
public interface IConversationStore
{
    Task<List<ChatMessageDto>> GetHistoryAsync(Guid tenantId, string customerPhone, CancellationToken ct = default);
    Task AppendMessageAsync(Guid tenantId, string customerPhone, ChatMessageDto message, CancellationToken ct = default);
    Task<bool> IsMessageProcessedAsync(string messageId, CancellationToken ct = default);
    Task MarkMessageProcessedAsync(string messageId, CancellationToken ct = default);
}

