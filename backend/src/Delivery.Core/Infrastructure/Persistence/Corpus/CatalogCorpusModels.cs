namespace Delivery.Core.Infrastructure.Persistence.Corpus;

/// <summary>
/// Representa el corpus estructurado y no sensible del catálogo gastronómico de una marca.
/// Permite el auto-aprovisionamiento e inicialización declarativa e idempotente de la base de datos.
/// </summary>
public sealed class TenantCatalogCorpus
{
    public string TenantSlug { get; set; } = string.Empty;
    public List<CorpusCategory> Categories { get; set; } = new();
    public List<CorpusModifierGroup> ModifierGroups { get; set; } = new();
    public List<CorpusProduct> Products { get; set; } = new();
}

public sealed class CorpusCategory
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class CorpusModifierGroup
{
    public string Name { get; set; } = string.Empty;
    public int MinSelectable { get; set; }
    public int MaxSelectable { get; set; }
    public bool IsRequired { get; set; }
    public List<CorpusModifierOption> Options { get; set; } = new();
}

public sealed class CorpusModifierOption
{
    public string Name { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
    public bool IsAvailable { get; set; } = true;
}

public sealed class CorpusProduct
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal TaxRate { get; set; } = 0.00m;
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsKitchen { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public List<string> ModifierGroups { get; set; } = new();
    public List<CorpusProductRecipe> Recipes { get; set; } = new();
}

public sealed class CorpusProductRecipe
{
    public string InventorySku { get; set; } = string.Empty;
    public decimal QuantityUsed { get; set; }
}

