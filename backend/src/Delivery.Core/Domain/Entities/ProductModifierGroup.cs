namespace Delivery.Core.Domain.Entities;

public class ProductModifierGroup
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int ModifierGroupId { get; set; }
    public ModifierGroup ModifierGroup { get; set; } = null!;
}
