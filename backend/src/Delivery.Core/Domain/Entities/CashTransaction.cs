using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class CashTransaction : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid ShiftId { get; set; }
    public CashShift Shift { get; set; } = null!;

    /// <summary>
    /// Tipo de transacción: "EGRESO" (compra gas, papas, insumos) o "INGRESO" (inyección de cambio).
    /// </summary>
    public string Type { get; set; } = "EGRESO";

    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Guid? AuthorizedByUserId { get; set; }
    public User? AuthorizedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

