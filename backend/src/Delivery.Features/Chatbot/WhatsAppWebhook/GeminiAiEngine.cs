using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public partial class GeminiAiEngine : IChatbotAiEngine
{
    private readonly HttpClient _httpClient;
    private readonly WhatsAppChatbotOptions _options;
    private readonly ILogger<GeminiAiEngine> _logger;

    public GeminiAiEngine(
        HttpClient httpClient,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<GeminiAiEngine> logger)
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
        if (string.IsNullOrWhiteSpace(_options.GeminiApiKey) || _options.GeminiApiKey.StartsWith("tu_", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("GEMINI_API_KEY no está configurada.");
        }

        var fullSystemPrompt = systemPrompt;
        if (!string.IsNullOrWhiteSpace(injectedOrderContext))
        {
            fullSystemPrompt += "\n\nCONTEXTO DINÁMICO ADICIONAL ENCONTRADO EN BASE DE DATOS:\n" + injectedOrderContext;
        }

        var contents = new List<object>();

        foreach (var h in history)
        {
            var role = h.Role == "assistant" ? "model" : "user";
            contents.Add(new
            {
                role,
                parts = new object[] { new { text = h.Content } }
            });
        }

        contents.Add(new
        {
            role = "user",
            parts = new object[] { new { text = userMessage } }
        });

        var requestBody = new
        {
            system_instruction = new
            {
                parts = new object[] { new { text = fullSystemPrompt } }
            },
            contents,
            generationConfig = new
            {
                temperature = 0.4,
                maxOutputTokens = 600
            }
        };

        var model = string.IsNullOrWhiteSpace(_options.GeminiModel) ? "gemini-2.0-flash" : _options.GeminiModel;
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_options.GeminiApiKey}";

        var json = JsonSerializer.Serialize(requestBody);
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        LogSendingFallbackRequest(_logger, model);

        using var response = await _httpClient.SendAsync(request, ct);
        var responseContent = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            LogErrorResponse(_logger, response.StatusCode, responseContent);
            throw new HttpRequestException($"Gemini API error: {response.StatusCode} - {responseContent}");
        }

        using var doc = JsonDocument.Parse(responseContent);

        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            LogMissingCandidates(_logger, responseContent);
            return "Disculpa, no pude procesar tu solicitud en este momento.";
        }

        var firstCandidate = candidates[0];
        if (!firstCandidate.TryGetProperty("content", out var contentElem) ||
            !contentElem.TryGetProperty("parts", out var parts) ||
            parts.GetArrayLength() == 0 ||
            !parts[0].TryGetProperty("text", out var textElem))
        {
            LogMissingTextParts(_logger, responseContent);
            return "Disculpa, no pude procesar tu solicitud en este momento.";
        }

        var text = textElem.GetString();
        return text?.Trim() ?? "Disculpa, no pude procesar tu solicitud en este momento.";
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Enviando petición de respaldo a Google Gemini ({Model})")]
    private static partial void LogSendingFallbackRequest(ILogger logger, string model);

    [LoggerMessage(EventId = 2, Level = LogLevel.Error, Message = "Gemini API respondió con error {StatusCode}: {Response}")]
    private static partial void LogErrorResponse(ILogger logger, HttpStatusCode statusCode, string response);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Gemini API retornó un cuerpo sin 'candidates': {Response}")]
    private static partial void LogMissingCandidates(ILogger logger, string response);

    [LoggerMessage(EventId = 4, Level = LogLevel.Error, Message = "Gemini API retornó un candidato sin partes de texto: {Response}")]
    private static partial void LogMissingTextParts(ILogger logger, string response);
}

