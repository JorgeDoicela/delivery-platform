namespace Delivery.Core.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    /// <summary>
    /// Snapshot inmutable del nombre del producto al momento exacto de la venta.
    /// </summary>
    public string ProductNameSnapshot { get; set; } = string.Empty;

    /// <summary>
    /// Snapshot inmutable del precio unitario base al momento exacto de la venta.
    /// </summary>
    public decimal UnitPriceSnapshot { get; set; }

    public int Quantity { get; set; }

    // Navegación
    public ICollection<OrderItemModifier> Modifiers { get; set; } = new List<OrderItemModifier>();
}
