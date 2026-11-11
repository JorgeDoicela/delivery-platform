using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public partial class WhatsAppClient : IWhatsAppClient
{
    private readonly HttpClient _httpClient;
    private readonly WhatsAppChatbotOptions _options;
    private readonly ILogger<WhatsAppClient> _logger;

    public WhatsAppClient(
        HttpClient httpClient,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<WhatsAppClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> SendTextMessageAsync(
        string recipientPhone,
        string messageText,
        string? phoneNumberId = null,
        CancellationToken ct = default)
    {
        var activePhoneId = !string.IsNullOrWhiteSpace(phoneNumberId)
            ? phoneNumberId
            : _options.PhoneNumberId;

        if (string.IsNullOrWhiteSpace(activePhoneId) || string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            LogMissingCredentials(_logger);
            return false;
        }

        var cleanPhone = recipientPhone.Replace("+", "").Trim();
        var url = $"https://graph.facebook.com/v21.0/{activePhoneId}/messages";

        var payload = new
        {
            messaging_product = "whatsapp",
            recipient_type = "individual",
            to = cleanPhone,
            type = "text",
            text = new
            {
                preview_url = false,
                body = messageText
            }
        };

        var json = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);

        LogSendingMessage(_logger, cleanPhone, activePhoneId);

        using var response = await _httpClient.SendAsync(request, ct);
        var responseContent = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            LogSendMessageError(_logger, cleanPhone, response.StatusCode, responseContent);
            return false;
        }

        LogMessageDelivered(_logger, cleanPhone, responseContent);
        return true;
    }

    public async Task MarkMessageAsReadAsync(string messageId, string? phoneNumberId = null, CancellationToken ct = default)
    {
        var activePhoneId = !string.IsNullOrWhiteSpace(phoneNumberId)
            ? phoneNumberId
            : _options.PhoneNumberId;

        if (string.IsNullOrWhiteSpace(activePhoneId) || string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            return;
        }

        var url = $"https://graph.facebook.com/v21.0/{activePhoneId}/messages";
        var payload = new
        {
            messaging_product = "whatsapp",
            status = "read",
            message_id = messageId
        };

        var json = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);

        try
        {
            using var response = await _httpClient.SendAsync(request, ct);
        }
        catch (Exception ex)
        {
            LogMarkAsReadFailed(_logger, ex, messageId);
        }
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Error, Message = "WhatsAppClient: PhoneNumberId o AccessToken no configurados.")]
    private static partial void LogMissingCredentials(ILogger logger);

    [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Enviando mensaje de WhatsApp a {Phone} desde PhoneId {PhoneId}")]
    private static partial void LogSendingMessage(ILogger logger, string phone, string phoneId);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Error enviando mensaje WhatsApp a {Phone}. Status: {StatusCode}, Body: {Response}")]
    private static partial void LogSendMessageError(ILogger logger, string phone, HttpStatusCode statusCode, string response);

    [LoggerMessage(EventId = 4, Level = LogLevel.Information, Message = "Mensaje entregado exitosamente a {Phone}. Respuesta Meta: {Response}")]
    private static partial void LogMessageDelivered(ILogger logger, string phone, string response);

    [LoggerMessage(EventId = 5, Level = LogLevel.Debug, Message = "No se pudo marcar el mensaje {MessageId} como leído")]
    private static partial void LogMarkAsReadFailed(ILogger logger, Exception ex, string messageId);
}

