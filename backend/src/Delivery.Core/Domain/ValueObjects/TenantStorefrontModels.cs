namespace Delivery.Core.Domain.ValueObjects;

public sealed record TenantHeroSlide
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Badge { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Subtitle { get; init; } = string.Empty;
    public string CtaText { get; init; } = "ORDENA AQUÍ";
    public string CtaHref { get; init; } = "/catalogo";
    public string ImageUrl { get; init; } = "/images/banners/hero-pollo-brasa.jpg";
    public int DisplayOrder { get; init; } = 1;
    public bool IsActive { get; init; } = true;
}

public sealed record TenantPromoBanner
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Title { get; init; } = string.Empty;
    public string Subtitle { get; init; } = string.Empty;
    public string CtaText { get; init; } = "Ver Combos";
    public string CtaHref { get; init; } = "/catalogo";
    public string ImageUrl { get; init; } = "/images/banners/promo-receta-tradicional.jpg";
    public string ThemeVariant { get; init; } = "dark"; // "dark" | "slate" | "brand"
    public int DisplayOrder { get; init; } = 1;
    public bool IsActive { get; init; } = true;
}

