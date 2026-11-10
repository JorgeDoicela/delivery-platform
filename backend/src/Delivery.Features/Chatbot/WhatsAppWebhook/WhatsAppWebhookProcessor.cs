using Microsoft.Extensions.Logging;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class WhatsAppWebhookProcessor : IWhatsAppWebhookProcessor
{
    private readonly ITenantKnowledgeProvider _knowledgeProvider;
    private readonly IConversationStore _conversationStore;
    private readonly IChatbotAiEngine _aiEngine;
    private readonly IWhatsAppClient _whatsAppClient;
    private readonly ILogger<WhatsAppWebhookProcessor> _logger;

    public WhatsAppWebhookProcessor(
        ITenantKnowledgeProvider knowledgeProvider,
        IConversationStore conversationStore,
        IChatbotAiEngine aiEngine,
        IWhatsAppClient whatsAppClient,
        ILogger<WhatsAppWebhookProcessor> logger)
    {
        _knowledgeProvider = knowledgeProvider;
        _conversationStore = conversationStore;
        _aiEngine = aiEngine;
        _whatsAppClient = whatsAppClient;
        _logger = logger;
    }

    public async Task ProcessPayloadAsync(WhatsAppWebhookPayload payload, CancellationToken ct = default)
    {
        if (payload?.Entry == null || payload.Entry.Count == 0) return;

        foreach (var entry in payload.Entry)
        {
            if (entry.Changes == null) continue;

            foreach (var change in entry.Changes)
            {
                if (change.Value?.Messages == null || change.Value.Messages.Count == 0)
                {
                    continue;
                }

                var phoneId = change.Value.Metadata?.PhoneNumberId ?? string.Empty;
                var contact = change.Value.Contacts?.FirstOrDefault();
                var contactName = contact?.Profile?.Name;

                foreach (var incoming in change.Value.Messages)
                {
                    await HandleSingleMessageAsync(incoming, phoneId, contactName, ct);
                }
            }
        }
    }

    private async Task HandleSingleMessageAsync(
        WhatsAppIncomingMessage incoming,
        string phoneId,
        string? contactName,
        CancellationToken ct)
    {
        var messageId = incoming.Id;
        var senderPhone = incoming.From;

        if (string.IsNullOrWhiteSpace(senderPhone) || string.IsNullOrWhiteSpace(messageId))
        {
            return;
        }

        if (await _conversationStore.IsMessageProcessedAsync(messageId, ct))
        {
            _logger.LogInformation("Mensaje duplicado ignorado: {MessageId}", messageId);
            return;
        }

        await _conversationStore.MarkMessageProcessedAsync(messageId, ct);
        await _whatsAppClient.MarkMessageAsReadAsync(messageId, phoneId, ct);

        if (incoming.Type != "text" || incoming.Text == null || string.IsNullOrWhiteSpace(incoming.Text.Body))
        {
            var politeMsg = "Hola" + (!string.IsNullOrWhiteSpace(contactName) ? $" {contactName}" : "") +
                            ". En este momento solo puedo procesar mensajes de texto. ¿En qué puedo ayudarte hoy?";
            await _whatsAppClient.SendTextMessageAsync(senderPhone, politeMsg, phoneId, ct);
            return;
        }

        var userText = incoming.Text.Body.Trim();
        _logger.LogInformation("Mensaje recibido de {Phone} ({Name}): {Text}", senderPhone, contactName ?? "Anónimo", userText);

        try
        {
            var tenantContext = await _knowledgeProvider.ResolveContextAsync(phoneId, userText, ct);
            var tenantId = tenantContext.Tenant.Id;

            var orderInfo = await _knowledgeProvider.TryResolveOrderStatusAsync(tenantId, senderPhone, userText, ct);
            var history = await _conversationStore.GetHistoryAsync(tenantId, senderPhone, ct);

            var aiReply = await _aiEngine.GenerateReplyAsync(
                tenantContext.SystemPrompt,
                history,
                userText,
                orderInfo,
                ct);

            var sent = await _whatsAppClient.SendTextMessageAsync(senderPhone, aiReply, phoneId, ct);

            if (sent)
            {
                await _conversationStore.AppendMessageAsync(tenantId, senderPhone, new ChatMessageDto
                {
                    Role = "user",
                    Content = userText,
                    Timestamp = DateTime.UtcNow
                }, ct);

                await _conversationStore.AppendMessageAsync(tenantId, senderPhone, new ChatMessageDto
                {
                    Role = "assistant",
                    Content = aiReply,
                    Timestamp = DateTime.UtcNow
                }, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando mensaje de WhatsApp de {Phone}", senderPhone);

            var fallbackMsg = "Estimado/a cliente, ocurrió un inconveniente temporal procesando tu mensaje. Si deseas ordenar, visita nuestra tienda en línea o intenta nuevamente en unos instantes.";
            await _whatsAppClient.SendTextMessageAsync(senderPhone, fallbackMsg, phoneId, ct);
        }
    }
}

