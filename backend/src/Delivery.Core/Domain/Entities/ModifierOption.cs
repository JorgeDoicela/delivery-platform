namespace Delivery.Core.Domain.Entities;

public class ModifierOption
{
    public int Id { get; set; }
    public int ModifierGroupId { get; set; }
    public ModifierGroup ModifierGroup { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
    public bool IsAvailable { get; set; } = true;
}
