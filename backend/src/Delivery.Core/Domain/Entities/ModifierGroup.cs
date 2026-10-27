namespace Delivery.Core.Domain.Entities;

public class ModifierGroup
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MinSelectable { get; set; }
    public int MaxSelectable { get; set; }
    public bool IsRequired { get; set; }

    // Navegación
    public ICollection<ProductModifierGroup> ProductModifierGroups { get; set; } = new List<ProductModifierGroup>();
    public ICollection<ModifierOption> Options { get; set; } = new List<ModifierOption>();
}
