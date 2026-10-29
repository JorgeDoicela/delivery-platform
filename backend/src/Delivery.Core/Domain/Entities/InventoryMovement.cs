using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class InventoryMovement : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public int InventoryItemId { get; set; }
    public InventoryItem InventoryItem { get; set; } = null!;

    /// <summary>
    /// Tipo de movimiento: "COMPRA", "VENTA_RECETA", "MERMA", "AJUSTE_INICIAL".
    /// </summary>
    public string MovementType { get; set; } = "VENTA_RECETA";

    /// <summary>
    /// Cantidad con signo (+ para ingresos, - para salidas).
    /// </summary>
    public decimal QuantityDelta { get; set; }
    public decimal StockBefore { get; set; }
    public decimal StockAfter { get; set; }
    public decimal UnitCostSnapshot { get; set; }

    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }

    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

