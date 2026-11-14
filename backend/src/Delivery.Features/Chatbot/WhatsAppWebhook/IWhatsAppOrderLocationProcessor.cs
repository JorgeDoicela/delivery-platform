namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public interface IWhatsAppOrderLocationProcessor
{
    /// <summary>
    /// Procesa una ubicación (actual o en tiempo real) recibida por WhatsApp,
    /// asociándola al pedido activo del comensal respetando el aislamiento Multi-Tenant y PostGIS.
    /// </summary>
    Task<bool> HandleLocationAsync(
        WhatsAppIncomingMessage incoming,
        WhatsAppExtractedLocation location,
        string phoneId,
        string? contactName,
        CancellationToken ct = default);
}
