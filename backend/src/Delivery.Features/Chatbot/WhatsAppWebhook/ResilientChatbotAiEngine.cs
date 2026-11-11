using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public partial class ResilientChatbotAiEngine : IChatbotAiEngine
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
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(15));
            return await _deepSeek.GenerateReplyAsync(systemPrompt, history, userMessage, injectedOrderContext, cts.Token);
        }
        catch (Exception ex)
        {
            LogDeepSeekFailed(_logger, ex);

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
                    LogGeminiFallbackFailed(_logger, geminiEx);
                }
            }

            return "Estimado/a cliente, en este momento nuestros servidores están procesando alta demanda. Si deseas realizar tu pedido inmediatamente, puedes ingresar a nuestra tienda oficial en línea o intentar nuevamente en un minuto.";
        }
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Warning, Message = "DeepSeek falló o agotó tiempo de respuesta (15s). Evaluando respaldo con Gemini...")]
    private static partial void LogDeepSeekFailed(ILogger logger, Exception ex);

    [LoggerMessage(EventId = 2, Level = LogLevel.Error, Message = "El servicio de respaldo Gemini también falló.")]
    private static partial void LogGeminiFallbackFailed(ILogger logger, Exception ex);
}

