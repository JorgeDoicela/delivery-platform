namespace Delivery.Core.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Tagline { get; set; } = "Asadero & Brasa";
    public string Description { get; set; } = string.Empty;
    public string HeroSubtitle { get; set; } = "Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal";
    public string BusinessName { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? BrandPrimaryColor { get; set; } = "#E4002B";
    public string? BrandPrimaryHoverColor { get; set; } = "#C40024";
    public string? BrandAccentColor { get; set; } = "#F59E0B";
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public TenantSetting? Settings { get; set; }
    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

