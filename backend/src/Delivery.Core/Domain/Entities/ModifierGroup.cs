using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class ModifierGroup : IMustHaveTenant
{
    public int Id { get; set; }

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public int MinSelectable { get; set; }
    public int MaxSelectable { get; set; }
    public bool IsRequired { get; set; }

    // Navegación
    public ICollection<ProductModifierGroup> ProductModifierGroups { get; set; } = new List<ProductModifierGroup>();
    public ICollection<ModifierOption> Options { get; set; } = new List<ModifierOption>();
}
