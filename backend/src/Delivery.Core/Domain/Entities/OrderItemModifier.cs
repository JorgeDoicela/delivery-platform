namespace Delivery.Core.Domain.Entities;

public class OrderItemModifier
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderItemId { get; set; }
    public OrderItem OrderItem { get; set; } = null!;

    public int ModifierOptionId { get; set; }
    public ModifierOption ModifierOption { get; set; } = null!;

    /// <summary>
    /// Snapshot inmutable del nombre del modificador seleccionado (ej. "Menestra de Fréjol").
    /// </summary>
    public string ModifierNameSnapshot { get; set; } = string.Empty;

    /// <summary>
    /// Snapshot inmutable del precio adicional cobrado al momento de la orden (ej. $1.50 o $0.00).
    /// </summary>
    public decimal PriceSnapshot { get; set; }
}
