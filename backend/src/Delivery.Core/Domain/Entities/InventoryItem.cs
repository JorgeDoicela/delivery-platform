using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class InventoryItem : IMustHaveTenant
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    /// <summary>
    /// Código estandarizado del insumo (ej. "INS-POLLO-OCT") para vincular recetas entre sucursales.
    /// </summary>
    public string Sku { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string UnitOfMeasure { get; set; } = "OCTAVO"; // OCTAVO, KG, UNIDAD, LITRO
    public decimal CurrentStock { get; set; }
    public decimal MinAlertStock { get; set; }
    public decimal CostPrice { get; set; }
    public bool IsActive { get; set; } = true;

    // Navegación
    public ICollection<ProductRecipe> ProductRecipes { get; set; } = new List<ProductRecipe>();
    public ICollection<InventoryMovement> Movements { get; set; } = new List<InventoryMovement>();
}

