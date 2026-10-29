namespace Delivery.Core.Domain.Entities;

public class ProductRecipe
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int InventoryItemId { get; set; }
    public InventoryItem InventoryItem { get; set; } = null!;

    /// <summary>
    /// Cantidad descontada del inventario por cada unidad vendida (ej. 8 octavos para 1 pollo).
    /// </summary>
    public decimal QuantityUsed { get; set; }
}

