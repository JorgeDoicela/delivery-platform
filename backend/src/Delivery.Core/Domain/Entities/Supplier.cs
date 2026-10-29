using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class Supplier : IMustHaveTenant
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<InventoryMovement> Movements { get; set; } = new List<InventoryMovement>();
}

