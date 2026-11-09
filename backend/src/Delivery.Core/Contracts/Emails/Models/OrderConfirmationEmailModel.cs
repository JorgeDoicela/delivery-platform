namespace Delivery.Core.Contracts.Emails.Models;

public sealed record OrderItemEmailDto(
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string? ModifiersSummary = null
);

/// <summary>
/// Modelo de datos para la plantilla de confirmación de pedido.
/// </summary>
public sealed record OrderConfirmationEmailModel
{
    public BrandEmailContext Brand { get; init; } = new();
    public int OrderNumber { get; init; }
    public Guid OrderId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public string BranchName { get; init; } = string.Empty;
    public string AddressStreet { get; init; } = string.Empty;
    public string? AddressReference { get; init; }
    public string PaymentMethod { get; init; } = string.Empty;
    public string? EstimatedDeliveryTime { get; init; }
    public string TrackingUrl { get; init; } = string.Empty;
    public List<OrderItemEmailDto> Items { get; init; } = new();
    public decimal Subtotal { get; init; }
    public decimal DeliveryFee { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal Total { get; init; }
}

