using System.Text.Json;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Infrastructure.Persistence;

public static partial class DatabaseSeeder
{
    private static async Task SeedSecondaryTenantsAsync(AppDbContext context)
    {
        // Tenant #2: Brasas del Valle (Parrilla Argentina & Cortes Angus)
        await EnsureSecondaryTenantAsync(
            context,
            slug: "brasas-del-valle",
            name: "Brasas del Valle",
            tagline: "Parrilla & Cortes Madurados",
            description: "Cortes Angus importados, bife de chorizo y parrilladas familiares asadas sobre quebracho colorado y carbón vegetal.",
            heroSubtitle: "Selecciona el término de cocción exacto, chimichurri argentino artesanal y guarniciones a la parrilla",
            businessName: "Gastronomía Brasas del Valle S.A.S.",
            taxId: "1793100200001",
            primaryColor: "#047857",
            hoverColor: "#065F46",
            accentColor: "#D97706",
            baseDeliveryFee: 2.00m,
            bankName: "Banco Guayaquil",
            bankAccountNumber: "0045891230",
            emailDomain: "brasasdelvalle.com",
            branchName: "Matriz Cumbayá & Quito Norte",
            branchAddress: "Av. Interoceánica y Paseo de los Chícaros",
            heroSlides: new List<TenantHeroSlide>
            {
                new()
                {
                    Id = "slide-brasas-1",
                    Badge = "Cortes Premium a la Parrilla",
                    Title = "PARRILLADA IMPERIAL AL QUEBRACHO",
                    Subtitle = "Bife de chorizo, lomo fino, chuleta ahumada, chorizo argentino, morcilla y papas al romero para 4 personas.",
                    CtaText = "PEDIR PARRILLADA",
                    CtaHref = "/catalogo",
                    ImageUrl = "/images/banners/hero-combo-familiar.jpg",
                    DisplayOrder = 1,
                    IsActive = true
                },
                new()
                {
                    Id = "slide-brasas-2",
                    Badge = "Maduración 28 Días",
                    Title = "BIFE DE CHORIZO ANGUS 400G",
                    Subtitle = "Sellado a fuego vivo con sal en escamas, mantequilla de ajo asado, ensalada tibia y papas rústicas.",
                    CtaText = "VER CORTES",
                    CtaHref = "/catalogo",
                    ImageUrl = "/images/banners/hero-pollo-brasa.jpg",
                    DisplayOrder = 2,
                    IsActive = true
                }
            },
            promos: new List<TenantPromoBanner>
            {
                new()
                {
                    Id = "promo-brasas-1",
                    Title = "Maduración en Cámara Propia",
                    Subtitle = "Controlamos humedad y temperatura durante 28 días para lograr terneza superior y sabor concentrado en cada corte.",
                    CtaText = "Explorar Carta",
                    CtaHref = "/catalogo",
                    ImageUrl = "/images/banners/promo-hecho-a-la-brasa.jpg",
                    ThemeVariant = "dark",
                    DisplayOrder = 1,
                    IsActive = true
                },
                new()
                {
                    Id = "promo-brasas-2",
                    Title = "Chimichurri & Salsas de Autor",
                    Subtitle = "Elaboradas diariamente con perejil fresco de huerto, orégano andino, ajo confitado y aceite de oliva extra virgen.",
                    CtaText = "Ordenar Ahora",
                    CtaHref = "/catalogo",
                    ImageUrl = "/images/banners/promo-receta-tradicional.jpg",
                    ThemeVariant = "slate",
                    DisplayOrder = 2,
                    IsActive = true
                }
            },
            productsSpec: new[]
            {
                ("PAR-IMP-01", "Parrillada Imperial 4 Personas", "Bife de chorizo, lomo fino, pechuga grillada, 2 chorizos argentinos, papas rústicas y chimichurri.", 34.50m, "Parrilladas", "/images/menu/combo-familiar.webp"),
                ("COR-BIF-01", "Bife de Chorizo Angus 400g", "Corte argentino madurado a la brasa con papas al romero y ensalada fresca.", 18.90m, "Cortes", "/images/menu/medio-pollo.webp"),
                ("COR-CHU-01", "Costillar & Chorizo Criollo", "Costillar de cerdo braseado lentamente con chorizo artesanal y yuca dorada.", 13.50m, "Cortes", "/images/menu/cuarto-pollo.webp")
            });
    }

    private static async Task EnsureSecondaryTenantAsync(
        AppDbContext context,
        string slug,
        string name,
        string tagline,
        string description,
        string heroSubtitle,
        string businessName,
        string taxId,
        string primaryColor,
        string hoverColor,
        string accentColor,
        decimal baseDeliveryFee,
        string bankName,
        string bankAccountNumber,
        string emailDomain,
        string branchName,
        string branchAddress,
        List<TenantHeroSlide> heroSlides,
        List<TenantPromoBanner> promos,
        (string Sku, string Name, string Description, decimal Price, string Category, string ImageUrl)[] productsSpec)
    {
        var existing = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == slug);

        if (existing != null) return;

        var tenant = new Tenant
        {
            Slug = slug,
            Name = name,
            Tagline = tagline,
            Description = description,
            HeroSubtitle = heroSubtitle,
            BusinessName = businessName,
            TaxId = taxId,
            BrandPrimaryColor = primaryColor,
            BrandPrimaryHoverColor = hoverColor,
            BrandAccentColor = accentColor,
            ContactPhone = "0998887766",
            ContactEmail = $"pedidos@{emailDomain}",
            LogoUrl = "/images/identidad/logo.png",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await context.Tenants.AddAsync(tenant);
        await context.SaveChangesAsync();

        var settings = new TenantSetting
        {
            TenantId = tenant.Id,
            CurrencyCode = "USD",
            SriEnvironment = "PRUEBAS",
            BaseDeliveryFee = baseDeliveryFee,
            EnableDelivery = true,
            EnableTakeout = true,
            EnableDineIn = true,
            AcceptsCash = true,
            AcceptsBankTransfer = true,
            AcceptsCard = true,
            BankName = bankName,
            BankAccountType = "Cuenta Corriente",
            BankAccountNumber = bankAccountNumber,
            BankAccountHolder = businessName,
            BankAccountTaxId = taxId,
            QuickLinksEnabled = true,
            HeroSlidesJson = JsonSerializer.Serialize(heroSlides, JsonOptions),
            PromotionalBannersJson = JsonSerializer.Serialize(promos, JsonOptions)
        };

        await context.TenantSettings.AddAsync(settings);
        await context.SaveChangesAsync();

        var branchLocation = GeometryFactory.CreatePoint(new Coordinate(-78.4845, -0.1782));
        var branchPolygon = GeometryFactory.CreatePolygon(new[]
        {
            new Coordinate(-78.5400, -0.1400),
            new Coordinate(-78.4500, -0.1400),
            new Coordinate(-78.4500, -0.2600),
            new Coordinate(-78.5400, -0.2600),
            new Coordinate(-78.5400, -0.1400)
        });

        var branch = new Branch
        {
            TenantId = tenant.Id,
            Name = branchName,
            Address = branchAddress,
            Phone = "0998887766",
            LocationPoint = branchLocation,
            CoveragePolygon = branchPolygon,
            MaxOrdersPerSlot = 18,
            SriEstablishmentCode = "001",
            SriEmissionPoint = "001",
            NextInvoiceSequence = 1,
            OpeningTime = "11:00",
            ClosingTime = "22:30",
            IsActive = true
        };

        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        await SeedOperationalUsersAsync(context, tenant.Id, branch.Id, emailDomain);

        var modGroup = new ModifierGroup
        {
            TenantId = tenant.Id,
            Name = "Guarnición & Punto de Casa",
            MinSelectable = 1,
            MaxSelectable = 2,
            IsRequired = true,
            Options = new List<ModifierOption>
            {
                new() { Name = "Papas Rústicas al Romero", AdditionalPrice = 0.00m, IsAvailable = true },
                new() { Name = "Ensalada Fresca de la Huerta", AdditionalPrice = 0.00m, IsAvailable = true },
                new() { Name = "Porción Extra Salsa / Chimichurri", AdditionalPrice = 1.00m, IsAvailable = true }
            }
        };
        await context.ModifierGroups.AddAsync(modGroup);
        await context.SaveChangesAsync();

        var distinctCategories = productsSpec.Select(p => p.Category).Distinct().ToList();
        var categoryEntities = distinctCategories.Select((catName, idx) => new Category
        {
            TenantId = tenant.Id,
            Name = catName,
            DisplayOrder = idx + 1,
            IsActive = true
        }).ToList();

        await context.Categories.AddRangeAsync(categoryEntities);
        await context.SaveChangesAsync();

        var products = productsSpec.Select(spec =>
        {
            var cat = categoryEntities.First(c => c.Name == spec.Category);
            return new Product
            {
                TenantId = tenant.Id,
                CategoryId = cat.Id,
                Sku = spec.Sku,
                Name = spec.Name,
                Description = spec.Description,
                BasePrice = spec.Price,
                TaxRate = 0.00m,
                ImageUrl = spec.ImageUrl,
                Category = spec.Category,
                IsKitchen = true,
                IsActive = true
            };
        }).ToList();

        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();

        foreach (var prod in products)
        {
            await context.BranchProducts.AddAsync(new BranchProduct
            {
                TenantId = tenant.Id,
                BranchId = branch.Id,
                ProductId = prod.Id,
                IsAvailable = true
            });
            await context.ProductModifierGroups.AddAsync(new ProductModifierGroup
            {
                ProductId = prod.Id,
                ModifierGroupId = modGroup.Id
            });
        }
        await context.SaveChangesAsync();
    }
}

