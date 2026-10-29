using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class Product : IMustHaveTenant
{
    public int Id { get; set; }

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int? CategoryId { get; set; }
    public Category? CategoryEntity { get; set; }

    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }

    /// <summary>
    /// Porcentaje de IVA aplicable según el SRI (ej. 0.00m o 15.00m).
    /// </summary>
    public decimal TaxRate { get; set; } = 0.00m;

    public string ImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsKitchen { get; set; } = true;
    public bool IsActive { get; set; } = true;

    // Navegación
    public ICollection<ProductModifierGroup> ProductModifierGroups { get; set; } = new List<ProductModifierGroup>();
    public ICollection<ProductRecipe> Recipes { get; set; } = new List<ProductRecipe>();
    public ICollection<BranchProduct> BranchProducts { get; set; } = new List<BranchProduct>();
}
