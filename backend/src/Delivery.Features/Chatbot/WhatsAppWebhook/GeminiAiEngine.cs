using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class GeminiAiEngine : IChatbotAiEngine
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

        _logger.LogInformation("Enviando petición de respaldo a Google Gemini ({Model})", model);

        using var response = await _httpClient.SendAsync(request, ct);
        var responseContent = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Gemini API respondió con error {StatusCode}: {Response}", response.StatusCode, responseContent);
            throw new HttpRequestException($"Gemini API error: {response.StatusCode} - {responseContent}");
        }

        using var doc = JsonDocument.Parse(responseContent);
        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return text?.Trim() ?? "Disculpa, no pude procesar tu solicitud en este momento.";
    }
}

