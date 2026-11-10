using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class ResilientChatbotAiEngine : IChatbotAiEngine
{
    private readonly DeepSeekAiEngine _deepSeek;
    private readonly GeminiAiEngine _gemini;
    private readonly WhatsAppChatbotOptions _options;
    private readonly ILogger<ResilientChatbotAiEngine> _logger;

    public ResilientChatbotAiEngine(
        DeepSeekAiEngine deepSeek,
        GeminiAiEngine gemini,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<ResilientChatbotAiEngine> logger)
    {
        _deepSeek = deepSeek;
        _gemini = gemini;
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
        try
        {
            return await _deepSeek.GenerateReplyAsync(systemPrompt, history, userMessage, injectedOrderContext, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DeepSeek falló o agotó tiempo de respuesta. Evaluando respaldo con Gemini...");

            var hasGemini = !string.IsNullOrWhiteSpace(_options.GeminiApiKey) &&
                            !_options.GeminiApiKey.StartsWith("tu_", StringComparison.OrdinalIgnoreCase);

            if (hasGemini)
            {
                try
                {
                    return await _gemini.GenerateReplyAsync(systemPrompt, history, userMessage, injectedOrderContext, ct);
                }
                catch (Exception geminiEx)
                {
                    _logger.LogError(geminiEx, "El servicio de respaldo Gemini también falló.");
                }
            }

            return "Estimado/a cliente, en este momento nuestros servidores están procesando alta demanda. Si deseas realizar tu pedido inmediatamente, puedes ingresar a nuestra tienda oficial en línea o intentar nuevamente en un minuto.";
        }
    }
}

