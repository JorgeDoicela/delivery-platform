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
            landingLayoutTemplate: "steakhouse-gourmet",
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
                    ImageUrl = "/images/tenants/brasas-del-valle/banners/hero-combo-familiar.jpg",
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
                    ImageUrl = "/images/tenants/brasas-del-valle/banners/hero-pollo-brasa.jpg",
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
                    ImageUrl = "/images/tenants/brasas-del-valle/banners/promo-hecho-a-la-brasa.jpg",
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
                    ImageUrl = "/images/tenants/brasas-del-valle/banners/promo-receta-tradicional.jpg",
                    ThemeVariant = "slate",
                    DisplayOrder = 2,
                    IsActive = true
                }
            },
            productsSpec: new[]
            {
                ("PAR-IMP-01", "Parrillada Imperial 4 Personas", "Bife de chorizo, lomo fino, pechuga grillada, 2 chorizos argentinos, papas rústicas y chimichurri.", 34.50m, "Parrilladas", "/images/tenants/brasas-del-valle/menu/combo-familiar.webp"),
                ("COR-BIF-01", "Bife de Chorizo Angus 400g", "Corte argentino madurado a la brasa con papas al romero y ensalada fresca.", 18.90m, "Cortes", "/images/tenants/brasas-del-valle/menu/medio-pollo.webp"),
                ("COR-CHU-01", "Costillar & Chorizo Criollo", "Costillar de cerdo braseado lentamente con chorizo artesanal y yuca dorada.", 13.50m, "Cortes", "/images/tenants/brasas-del-valle/menu/cuarto-pollo.webp")
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
        string landingLayoutTemplate,
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

        if (existing != null)
        {
            var needsSave = false;
            if (string.IsNullOrWhiteSpace(existing.LogoUrl) || existing.LogoUrl.StartsWith("/images/identidad/", StringComparison.OrdinalIgnoreCase))
            {
                existing.LogoUrl = $"/images/tenants/{slug}/identidad/logo.png";
                needsSave = true;
            }
            var secondarySettings = await context.TenantSettings
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(ts => ts.TenantId == existing.Id);
            if (secondarySettings != null)
            {
                if (!string.IsNullOrEmpty(secondarySettings.HeroSlidesJson) && secondarySettings.HeroSlidesJson.Contains("/images/banners/"))
                {
                    secondarySettings.HeroSlidesJson = secondarySettings.HeroSlidesJson.Replace("/images/banners/", $"/images/tenants/{slug}/banners/");
                    needsSave = true;
                }
                if (!string.IsNullOrEmpty(secondarySettings.PromotionalBannersJson) && secondarySettings.PromotionalBannersJson.Contains("/images/banners/"))
                {
                    secondarySettings.PromotionalBannersJson = secondarySettings.PromotionalBannersJson.Replace("/images/banners/", $"/images/tenants/{slug}/banners/");
                    needsSave = true;
                }
                if (!secondarySettings.EnableWhatsAppBot)
                {
                    secondarySettings.EnableWhatsAppBot = true;
                    needsSave = true;
                }
                if (!secondarySettings.RequireDataProtectionConsent)
                {
                    secondarySettings.RequireDataProtectionConsent = true;
                    needsSave = true;
                }
            }

            var secondaryBranches = await context.Branches
                .IgnoreQueryFilters()
                .Where(b => b.TenantId == existing.Id)
                .ToListAsync();
            foreach (var b in secondaryBranches)
            {
                if (!b.DeliveryRadiusKm.HasValue)
                {
                    b.DeliveryRadiusKm = 25.0;
                    b.IsCoverageStrict = true;
                    needsSave = true;
                }
            }
            if (needsSave)
            {
                await context.SaveChangesAsync();
            }
            return;
        }

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
            LogoUrl = $"/images/tenants/{slug}/identidad/logo.png",
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
            LandingLayoutTemplate = landingLayoutTemplate,
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
            DeliveryRadiusKm = 25.0,
            IsCoverageStrict = true,
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

        // 1. Mesas de salón para el tenant secundario (idempotente)
        var secondaryTableNames = Enumerable.Range(1, 6).Select(i => $"Mesa {i}").ToList();
        var existingSecondaryTables = await context.DiningTables.IgnoreQueryFilters()
            .Where(dt => dt.BranchId == branch.Id)
            .Select(dt => dt.Name)
            .ToListAsync();

        var existingTableSet = new HashSet<string>(existingSecondaryTables, StringComparer.OrdinalIgnoreCase);
        var tablesToAdd = secondaryTableNames
            .Where(name => !existingTableSet.Contains(name))
            .Select(name => new DiningTable
            {
                TenantId = tenant.Id,
                BranchId = branch.Id,
                Name = name,
                IsActive = true
            })
            .ToList();

        if (tablesToAdd.Count > 0)
        {
            await context.DiningTables.AddRangeAsync(tablesToAdd);
            await context.SaveChangesAsync();
        }

        // 2. Proveedor e insumos de inventario para el tenant secundario
        var secondarySupplier = await context.Suppliers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.TenantId == tenant.Id);

        if (secondarySupplier == null)
        {
            secondarySupplier = new Supplier
            {
                TenantId = tenant.Id,
                Name = "Frigorífico & Carnes del Valle S.A.S.",
                TaxId = "1793100200001",
                Phone = "022890123",
                Email = "proveeduria@carnesdelvalle.ec",
                Address = "Av. Interoceánica Km 11, Cumbayá",
                IsActive = true
            };
            await context.Suppliers.AddAsync(secondarySupplier);
            await context.SaveChangesAsync();
        }

        var secondaryItemSpecs = new (string Sku, string Name, string Unit, decimal Stock, decimal MinStock, decimal Cost)[]
        {
            ("INS-BIFE-ANGUS", "Corte Bife de Chorizo Angus (Kg)", "KG", 120m, 20m, 9.50m),
            ("INS-CHOR-ARG", "Chorizo Parrillero Argentino", "UNIDAD", 300m, 40m, 0.85m),
            ("INS-COST-CERDO", "Costillar de Cerdo Madurado (Kg)", "KG", 80m, 15m, 6.20m),
            ("INS-PAPA-5KG", "Papas Rústicas al Romero (Bolsa 5kg)", "BOLSA", 40m, 10m, 3.50m)
        };

        var existingSecondaryItems = await context.InventoryItems.IgnoreQueryFilters()
            .Where(i => i.BranchId == branch.Id)
            .ToListAsync();

        var existingSecondaryBySku = existingSecondaryItems.ToDictionary(i => i.Sku, StringComparer.OrdinalIgnoreCase);
        var newSecondaryItems = new List<InventoryItem>();

        foreach (var spec in secondaryItemSpecs)
        {
            if (!existingSecondaryBySku.TryGetValue(spec.Sku, out var item))
            {
                item = new InventoryItem
                {
                    TenantId = tenant.Id,
                    BranchId = branch.Id,
                    Sku = spec.Sku,
                    Name = spec.Name,
                    UnitOfMeasure = spec.Unit,
                    CurrentStock = spec.Stock,
                    MinAlertStock = spec.MinStock,
                    CostPrice = spec.Cost,
                    IsActive = true
                };
                newSecondaryItems.Add(item);
            }
        }

        if (newSecondaryItems.Count > 0)
        {
            await context.InventoryItems.AddRangeAsync(newSecondaryItems);
            await context.SaveChangesAsync();

            var movements = newSecondaryItems.Select(item => new InventoryMovement
            {
                TenantId = tenant.Id,
                BranchId = branch.Id,
                InventoryItemId = item.Id,
                SupplierId = secondarySupplier.Id,
                MovementType = "COMPRA_PROVEEDOR",
                QuantityDelta = item.CurrentStock,
                StockBefore = 0m,
                StockAfter = item.CurrentStock,
                UnitCostSnapshot = item.CostPrice,
                Notes = $"Carga inicial de inventario parrillero ({branch.Name})",
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await context.InventoryMovements.AddRangeAsync(movements);
            await context.SaveChangesAsync();
        }

        // 3. Prioriza la ingesta declarativa desde el corpus estructurado por marca
        var seededFromCorpus = await SeedCatalogFromCorpusAsync(context, tenant.Id, slug, new List<Branch> { branch });
        if (seededFromCorpus)
        {
            return;
        }

        var modGroup = new ModifierGroup
        {
            TenantId = tenant.Id,
            Name = "Guarnición & Punto de Casa",
            MinSelectable = 0,
            MaxSelectable = 2,
            IsRequired = false,
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

