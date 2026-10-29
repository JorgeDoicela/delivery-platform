using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class DiningTable : IMustHaveTenant
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

