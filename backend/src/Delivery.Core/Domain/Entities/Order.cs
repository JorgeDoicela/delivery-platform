using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Enums;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Domain.Entities;

public class Order : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    /// <summary>
    /// Número secuencial legible de comanda/ticket para cocina KDS y entrega (ej. 1001, 1002).
    /// </summary>
    public int OrderNumber { get; set; }

    // Vinculación opcional a cliente registrado/frecuente, turno de caja y mesa de salón
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public Guid? ShiftId { get; set; }
    public CashShift? Shift { get; set; }

    public int? DiningTableId { get; set; }
    public DiningTable? DiningTable { get; set; }

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
    public string? CustomerNotes { get; set; }

    /// <summary>
    /// Ubicación geográfica de entrega proporcionada por el pin en mapa (SRID 4326).
    /// </summary>
    public Point? DeliveryLocation { get; set; }

    // Totales Financieros
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }

    // Estados y Modo de Entrega
    public OrderSource Source { get; set; } = OrderSource.WebStorefront;
    public OrderStatus Status { get; set; } = OrderStatus.Created;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;
    public DeliveryType DeliveryType { get; set; } = DeliveryType.Delivery;
    public string? CancellationReason { get; set; }

    // Usuario que registró el pedido en POS local (Cajero/Mesero)
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    // Desglose de Efectivo / Comprobantes
    public decimal? CashAmountPaid { get; set; }
    public decimal? ChangeDue { get; set; }
    public string? TransferReceiptUrl { get; set; }

    // Auditoría Temporal
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navegación
    public Invoice? Invoice { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
