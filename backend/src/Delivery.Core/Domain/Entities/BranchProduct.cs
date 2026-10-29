using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

/// <summary>
/// Controla la disponibilidad de un producto (agotado/disponible) y precio opcional
/// de forma independiente por cada sucursal física.
/// </summary>
public class BranchProduct : IMustHaveTenant
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public bool IsAvailable { get; set; } = true;
    public decimal? CustomPrice { get; set; }
}

