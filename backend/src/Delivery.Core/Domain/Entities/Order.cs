using Delivery.Core.Domain.Enums;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Domain.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    // Datos del Cliente (Checkout sin fricción / invitado)
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }

    // Datos de Facturación (Consumidor Final o datos SRI)
    public string IdentificationType { get; set; } = "CONSUMIDOR_FINAL";
    public string IdentificationNumber { get; set; } = "9999999999999";

    // Datos de Despacho y Ubicación
    public string AddressStreet { get; set; } = string.Empty;
    public string AddressReference { get; set; } = string.Empty;

    /// <summary>
    /// Ubicación geográfica de entrega proporcionada por el pin en mapa (SRID 4326).
    /// </summary>
    public Point? DeliveryLocation { get; set; }

    // Totales Financieros
    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }

    // Estados y Modo de Entrega
    public OrderStatus Status { get; set; } = OrderStatus.Created;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;
    public DeliveryType DeliveryType { get; set; } = DeliveryType.Delivery;

    // Desglose de Efectivo / Comprobantes
    public decimal? CashAmountPaid { get; set; }
    public decimal? ChangeDue { get; set; }
    public string? TransferReceiptUrl { get; set; }

    // Auditoría Temporal
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navegación
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
