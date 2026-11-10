namespace Delivery.Features.Chatbot.WhatsAppWebhook;

/// <summary>
/// Opciones de configuración para la integración de WhatsApp Cloud API e IA conversacional.
/// </summary>
public class WhatsAppChatbotOptions
{
    public const string SectionName = "WhatsAppChatbot";

    /// <summary>
    /// Identificador numérico de teléfono en Meta Cloud API (ej. 1349339028273599).
    /// </summary>
    public string PhoneNumberId { get; set; } = string.Empty;

    /// <summary>
    /// Identificador de la cuenta de WhatsApp Business (WABA ID).
    /// </summary>
    public string BusinessAccountId { get; set; } = string.Empty;

    /// <summary>
    /// Token de acceso Bearer emitido por Meta para el envío de mensajes.
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Token secreto de verificación configurado en el panel de Meta para validar el webhook.
    /// </summary>
    public string VerifyToken { get; set; } = "mesafy_secure_webhook_token_2026";

    /// <summary>
    /// Clave de API para el servicio DeepSeek.
    /// </summary>
    public string DeepSeekApiKey { get; set; } = string.Empty;

    /// <summary>
    /// URL base de la API de DeepSeek compatible con OpenAI.
    /// </summary>
    public string DeepSeekBaseUrl { get; set; } = "https://api.deepseek.com";

    /// <summary>
    /// Modelo de inferencia para DeepSeek (ej. deepseek-chat).
    /// </summary>
    public string DeepSeekModel { get; set; } = "deepseek-chat";

    /// <summary>
    /// Clave de API de respaldo para Google Gemini.
    /// </summary>
    public string? GeminiApiKey { get; set; }

    /// <summary>
    /// Modelo de inferencia para Google Gemini (ej. gemini-2.0-flash).
    /// </summary>
    public string GeminiModel { get; set; } = "gemini-2.0-flash";

    /// <summary>
    /// Dominio base de la plataforma para generar enlaces de pedidos y seguimiento.
    /// </summary>
    public string PlatformDomain { get; set; } = "mesafy.doicela.dev";
}

