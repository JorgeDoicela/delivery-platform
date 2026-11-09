namespace Delivery.Core.Contracts.Emails.Models;

/// <summary>
/// Modelo de datos para la notificación de cambio de estado en la comanda.
/// </summary>
public sealed record OrderStatusChangedEmailModel
{
    public BrandEmailContext Brand { get; init; } = new();
    public int OrderNumber { get; init; }
    public Guid OrderId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string PreviousStatus { get; init; } = string.Empty;
    public string CurrentStatus { get; init; } = string.Empty;
    public string StatusTitle { get; init; } = string.Empty;
    public string StatusDescription { get; init; } = string.Empty;
    public string TrackingUrl { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
}

