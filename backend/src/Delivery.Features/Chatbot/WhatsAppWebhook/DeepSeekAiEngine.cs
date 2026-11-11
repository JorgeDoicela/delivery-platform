using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public partial class DeepSeekAiEngine : IChatbotAiEngine
{
    private readonly HttpClient _httpClient;
    private readonly WhatsAppChatbotOptions _options;
    private readonly ILogger<DeepSeekAiEngine> _logger;

    public DeepSeekAiEngine(
        HttpClient httpClient,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<DeepSeekAiEngine> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> GenerateReplyAsync(
        string systemPrompt,
        List<ChatMessageDto> history,
        string userMessage,
        string? injectedOrderContext = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.DeepSeekApiKey))
        {
            throw new InvalidOperationException("DEEPSEEK_API_KEY no está configurada.");
        }

        var fullSystemPrompt = systemPrompt;
        if (!string.IsNullOrWhiteSpace(injectedOrderContext))
        {
            fullSystemPrompt += "\n\nCONTEXTO DINÁMICO ADICIONAL ENCONTRADO EN BASE DE DATOS:\n" + injectedOrderContext;
        }

        var messages = new List<object>
        {
            new { role = "system", content = fullSystemPrompt }
        };

        foreach (var h in history)
        {
            messages.Add(new { role = h.Role, content = h.Content });
        }

        messages.Add(new { role = "user", content = userMessage });

        var requestBody = new
        {
            model = string.IsNullOrWhiteSpace(_options.DeepSeekModel) ? "deepseek-chat" : _options.DeepSeekModel,
            messages,
            temperature = 0.4,
            max_tokens = 600,
            stream = false
        };

        var json = JsonSerializer.Serialize(requestBody);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.DeepSeekBaseUrl.TrimEnd('/')}/chat/completions")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.DeepSeekApiKey);

        LogSendingRequest(_logger, requestBody.model, history.Count);

        using var response = await _httpClient.SendAsync(request, ct);
        var responseContent = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            LogApiError(_logger, response.StatusCode, responseContent);
            throw new HttpRequestException($"DeepSeek API error: {response.StatusCode} - {responseContent}");
        }

        using var doc = JsonDocument.Parse(responseContent);

        if (!doc.RootElement.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
        {
            LogMissingChoices(_logger, responseContent);
            return "En este momento no pude procesar tu consulta. Por favor intenta de nuevo.";
        }

        var firstChoice = choices[0];
        if (!firstChoice.TryGetProperty("message", out var message) ||
            !message.TryGetProperty("content", out var contentElement))
        {
            LogUnexpectedStructure(_logger, responseContent);
            return "En este momento no pude procesar tu consulta. Por favor intenta de nuevo.";
        }

        var content = contentElement.GetString();
        return content?.Trim() ?? "En este momento no pude procesar tu consulta. Por favor intenta de nuevo.";
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Enviando petición a DeepSeek ({Model}) con {Count} mensajes previos.")]
    private static partial void LogSendingRequest(ILogger logger, string model, int count);

    [LoggerMessage(EventId = 2, Level = LogLevel.Error, Message = "DeepSeek API respondió con error {StatusCode}: {Response}")]
    private static partial void LogApiError(ILogger logger, HttpStatusCode statusCode, string response);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "DeepSeek API retornó un cuerpo sin 'choices': {Response}")]
    private static partial void LogMissingChoices(ILogger logger, string response);

    [LoggerMessage(EventId = 4, Level = LogLevel.Error, Message = "DeepSeek API retornó una estructura de mensaje inesperada: {Response}")]
    private static partial void LogUnexpectedStructure(ILogger logger, string response);
}

