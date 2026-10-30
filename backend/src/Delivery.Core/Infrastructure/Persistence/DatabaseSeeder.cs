using System.Text.Json;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Infrastructure.Persistence;

public static partial class DatabaseSeeder
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private static readonly string DefaultDevPasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword("Admin123!", 11);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static async Task SeedAsync(AppDbContext context)
    {
        // 1. Semilla de Roles del Sistema (Globales)
        if (!await context.Roles.AnyAsync())
        {
            var roles = new List<Role>
            {
                new() { Id = Role.SuperAdmin, Name = "SuperAdmin", Description = "Administrador global de la plataforma SaaS" },
                new() { Id = Role.TenantAdmin, Name = "TenantAdmin", Description = "Dueño / Gerente de la marca" },
                new() { Id = Role.BranchManager, Name = "BranchManager", Description = "Administrador de sucursal local" },
                new() { Id = Role.Cashier, Name = "Cashier", Description = "Cajero de salón / mostrador" },
                new() { Id = Role.KitchenStaff, Name = "KitchenStaff", Description = "Personal de cocina y pantallas KDS" },
                new() { Id = Role.Driver, Name = "Driver", Description = "Repartidor motorizado" },
                new() { Id = Role.Customer, Name = "Customer", Description = "Cliente registrado de la tienda web" }
            };

            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
        }

        // 2. SuperAdmin Global de la Plataforma SaaS (TenantId == null)
        var globalAdmin = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == "jorge@admin.com" && u.TenantId == null);

        if (globalAdmin == null)
        {
            globalAdmin = new User
            {
                TenantId = null,
                Email = "jorge@admin.com",
                FullName = "Jorge - Super Administrador SaaS",
                Phone = "0999999999",
                PasswordHash = DefaultDevPasswordHash,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await context.Users.AddAsync(globalAdmin);
            await context.SaveChangesAsync();

            await context.UserRoles.AddAsync(new UserRole
            {
                UserId = globalAdmin.Id,
                RoleId = Role.SuperAdmin,
                BranchId = null
            });
            await context.SaveChangesAsync();
        }

        // 3. Semilla de Tenant #1: La Granjita Asadero
        await SeedLaGranjitaTenantAsync(context);

        // 4. Semilla de Tenants Adicionales para Demostración Multi-Tenant Real
        await SeedSecondaryTenantsAsync(context);
    }

    private static async Task SeedLaGranjitaTenantAsync(AppDbContext context)
    {
        var defaultHeroSlides = new List<TenantHeroSlide>
        {
            new()
            {
                Id = "slide-granjita-1",
                Badge = "Especial del Asador",
                Title = "LO QUE TE FALTA ES BRASA Y LEÑA",
                Subtitle = "Pollo entero asado lentamente al carbón vegetal con guarniciones calientes, ensalada fresca y ají artesanal.",
                CtaText = "ORDENA AQUÍ",
                CtaHref = "/catalogo",
                ImageUrl = "/images/banners/hero-pollo-brasa.jpg",
                DisplayOrder = 1,
                IsActive = true
            },
            new()
            {
                Id = "slide-granjita-2",
                Badge = "Ahorro Familiar",
                Title = "SUPER COMBO ASADOR 12 PRESAS",
                Subtitle = "Rinde para 5 a 6 personas. Incluye porción doble de papas fritas rústicas, ensalada grande y gaseosa familiar.",
                CtaText = "ORDENA AQUÍ",
                CtaHref = "/catalogo",
                ImageUrl = "/images/banners/hero-combo-familiar.jpg",
                DisplayOrder = 2,
                IsActive = true
            },
            new()
            {
                Id = "slide-granjita-3",
                Badge = "Favorito del Almuerzo",
                Title = "COMBO CUARTO DE POLLO CLÁSICO",
                Subtitle = "Presa dorada y jugosa con papas fritas rústicas artesanales, ensalada fresca, ají criollo y bebida personal.",
                CtaText = "ORDENA AQUÍ",
                CtaHref = "/catalogo",
                ImageUrl = "/images/banners/hero-combo-personal.jpg",
                DisplayOrder = 3,
                IsActive = true
            }
        };

        var defaultPromos = new List<TenantPromoBanner>
        {
            new()
            {
                Id = "promo-granjita-1",
                Title = "24 Horas de Marinado a Fuego Lento",
                Subtitle = "Nuestra receta tradicional combina especias frescas, ajo asado y limón con cocción lenta sobre leña y carbón vegetal.",
                CtaText = "Conoce Más",
                CtaHref = "/catalogo",
                ImageUrl = "/images/banners/promo-receta-tradicional.jpg",
                ThemeVariant = "slate",
                DisplayOrder = 1,
                IsActive = true
            },
            new()
            {
                Id = "promo-granjita-2",
                Title = "HECHO A LA BRASA",
                Subtitle = "Cada pollo se asa al momento en nuestros hornos ecológicos de alta temperatura para garantizar piel crujiente y carne jugosa.",
                CtaText = "Ver Combos",
                CtaHref = "/catalogo",
                ImageUrl = "/images/banners/promo-hecho-a-la-brasa.jpg",
                ThemeVariant = "dark",
                DisplayOrder = 2,
                IsActive = true
            }
        };

        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.Settings)
            .FirstOrDefaultAsync(t => t.Slug == "la-granjita");

        if (tenant == null)
        {
            tenant = new Tenant
            {
                Slug = "la-granjita",
                Name = "La Granjita Asadero",
                Tagline = "Asadero & Leña",
                Description = "Pollo asado artesanalmente al carbón vegetal y leña seleccionada en La Granjita Asadero. Pedidos directos sin intermediarios.",
                HeroSubtitle = "Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal",
                BusinessName = "Asadero La Granjita Cia. Ltda.",
                TaxId = "1754455341001",
                BrandPrimaryColor = "#E4002B",
                BrandPrimaryHoverColor = "#C40024",
                BrandAccentColor = "#F59E0B",
                ContactPhone = "0987654321",
                ContactEmail = "pedidos@lagranjita.com",
                LogoUrl = "/images/identidad/logo.png",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await context.Tenants.AddAsync(tenant);
            await context.SaveChangesAsync();
        }
        else
        {
            if (string.IsNullOrWhiteSpace(tenant.Tagline)) tenant.Tagline = "Asadero & Leña";
            if (string.IsNullOrWhiteSpace(tenant.Description))
                tenant.Description = "Pollo asado artesanalmente al carbón vegetal y leña seleccionada en La Granjita Asadero. Pedidos directos sin intermediarios.";
            if (string.IsNullOrWhiteSpace(tenant.BrandPrimaryHoverColor)) tenant.BrandPrimaryHoverColor = "#C40024";
            if (string.IsNullOrWhiteSpace(tenant.BrandAccentColor)) tenant.BrandAccentColor = "#F59E0B";
            if (string.IsNullOrWhiteSpace(tenant.ContactPhone)) tenant.ContactPhone = "0987654321";
            if (string.IsNullOrWhiteSpace(tenant.ContactEmail)) tenant.ContactEmail = "pedidos@lagranjita.com";
            await context.SaveChangesAsync();
        }

        var settings = await context.TenantSettings
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(ts => ts.TenantId == tenant.Id);

        if (settings == null)
        {
            settings = new TenantSetting
            {
                TenantId = tenant.Id,
                CurrencyCode = "USD",
                SriEnvironment = "PRUEBAS",
                BaseDeliveryFee = 1.50m,
                EnableDelivery = true,
                EnableTakeout = true,
                EnableDineIn = true,
                AcceptsCash = true,
                AcceptsBankTransfer = true,
                AcceptsCard = false,
                BankName = "Banco Pichincha",
                BankAccountType = "Cuenta Corriente",
                BankAccountNumber = "2100456789",
                BankAccountHolder = "Asadero La Granjita Cia. Ltda.",
                BankAccountTaxId = "1754455341001",
                QuickLinksEnabled = true,
                HeroSlidesJson = JsonSerializer.Serialize(defaultHeroSlides, JsonOptions),
                PromotionalBannersJson = JsonSerializer.Serialize(defaultPromos, JsonOptions)
            };

            await context.TenantSettings.AddAsync(settings);
            await context.SaveChangesAsync();
        }
        else if (string.IsNullOrWhiteSpace(settings.HeroSlidesJson) || settings.HeroSlidesJson == "[]")
        {
            settings.BankName ??= "Banco Pichincha";
            settings.BankAccountType ??= "Cuenta Corriente";
            settings.BankAccountNumber ??= "2100456789";
            settings.BankAccountHolder ??= "Asadero La Granjita Cia. Ltda.";
            settings.BankAccountTaxId ??= "1754455341001";
            settings.HeroSlidesJson = JsonSerializer.Serialize(defaultHeroSlides, JsonOptions);
            settings.PromotionalBannersJson = JsonSerializer.Serialize(defaultPromos, JsonOptions);
            await context.SaveChangesAsync();
        }

        // Sucursales y Geocercas PostGIS (establecimientos SRI 001 y 002)
        var branches = await context.Branches
            .IgnoreQueryFilters()
            .Where(b => b.TenantId == tenant.Id)
            .OrderBy(b => b.Id)
            .ToListAsync();

        if (branches.Count == 0)
        {
            var branch1Location = GeometryFactory.CreatePoint(new Coordinate(-78.4845, -0.1782));
            var branch1Polygon = GeometryFactory.CreatePolygon(new[]
            {
                new Coordinate(-78.5100, -0.1500),
                new Coordinate(-78.4600, -0.1500),
                new Coordinate(-78.4600, -0.2000),
                new Coordinate(-78.5100, -0.2000),
                new Coordinate(-78.5100, -0.1500)
            });

            var branch2Location = GeometryFactory.CreatePoint(new Coordinate(-78.5180, -0.2300));
            var branch2Polygon = GeometryFactory.CreatePolygon(new[]
            {
                new Coordinate(-78.5400, -0.2001),
                new Coordinate(-78.4900, -0.2001),
                new Coordinate(-78.4900, -0.2600),
                new Coordinate(-78.5400, -0.2600),
                new Coordinate(-78.5400, -0.2001)
            });

            branches = new List<Branch>
            {
                new()
                {
                    TenantId = tenant.Id,
                    Name = "Sucursal #1 (Norte)",
                    Address = "Av. Amazonas y República (Edif. Sky)",
                    Phone = "0987654321",
                    LocationPoint = branch1Location,
                    CoveragePolygon = branch1Polygon,
                    MaxOrdersPerSlot = 15,
                    SriEstablishmentCode = "001",
                    SriEmissionPoint = "001",
                    NextInvoiceSequence = 1,
                    OpeningTime = "10:30",
                    ClosingTime = "21:30",
                    IsActive = true
                },
                new()
                {
                    TenantId = tenant.Id,
                    Name = "Sucursal #2 (Sur)",
                    Address = "Av. Rodrigo de Chávez y Maldonado",
                    Phone = "0987654322",
                    LocationPoint = branch2Location,
                    CoveragePolygon = branch2Polygon,
                    MaxOrdersPerSlot = 15,
                    SriEstablishmentCode = "002",
                    SriEmissionPoint = "001",
                    NextInvoiceSequence = 1,
                    OpeningTime = "10:30",
                    ClosingTime = "21:30",
                    IsActive = true
                }
            };

            await context.Branches.AddRangeAsync(branches);
            await context.SaveChangesAsync();
        }

        var primaryBranch = branches[0];

        await SeedOperationalUsersAsync(context, tenant.Id, primaryBranch.Id, "lagranjita.com");

        foreach (var branch in branches)
        {
            if (!await context.DiningTables.IgnoreQueryFilters().AnyAsync(dt => dt.BranchId == branch.Id))
            {
                var tables = Enumerable.Range(1, 8).Select(i => new DiningTable
                {
                    TenantId = tenant.Id,
                    BranchId = branch.Id,
                    Name = $"Mesa {i}",
                    IsActive = true
                }).ToList();

                await context.DiningTables.AddRangeAsync(tables);
                await context.SaveChangesAsync();
            }
        }

        await SeedInventoryAndSupplierAsync(context, tenant.Id, branches);
        await SeedCatalogAndRecipesAsync(context, tenant.Id, branches);

        if (!await context.Customers.IgnoreQueryFilters().AnyAsync(c => c.TenantId == tenant.Id))
        {
            await context.Customers.AddAsync(new Customer
            {
                TenantId = tenant.Id,
                IdentificationType = "RUC",
                IdentificationNumber = "1790016919001",
                FullName = "Corporación Favorita C.A.",
                Phone = "0991234567",
                Email = "facturacion@favorita.com",
                DefaultAddressStreet = "Av. General Enríquez y Vía Cotogchoa",
                DefaultAddressReference = "Edificio Corporativo Piso 3",
                DefaultLocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.4850, -0.1790)),
                TotalOrdersCount = 0,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedOperationalUsersAsync(AppDbContext context, Guid tenantId, int primaryBranchId, string emailDomain)
    {
        var staffSpecs = new[]
        {
            (Email: $"jorge@{emailDomain}", Name: "Jorge - Super Administrador", Phone: "0999999999", RoleId: Role.SuperAdmin, BranchScoped: false),
            (Email: $"esmeralda@{emailDomain}", Name: "Esmeralda - Administradora", Phone: "0987654321", RoleId: Role.TenantAdmin, BranchScoped: false),
            (Email: $"cajero@{emailDomain}", Name: "Cajero Principal", Phone: "0987654323", RoleId: Role.Cashier, BranchScoped: true),
            (Email: $"cocina@{emailDomain}", Name: "Maestro Hornero KDS", Phone: "0987654324", RoleId: Role.KitchenStaff, BranchScoped: true),
            (Email: $"repartidor@{emailDomain}", Name: "Carlos Motorizado #1", Phone: "0987654325", RoleId: Role.Driver, BranchScoped: true)
        };

        foreach (var spec in staffSpecs)
        {
            var user = await context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == spec.Email && u.TenantId == tenantId);

            if (user == null)
            {
                user = new User
                {
                    TenantId = tenantId,
                    Email = spec.Email,
                    FullName = spec.Name,
                    Phone = spec.Phone,
                    PasswordHash = DefaultDevPasswordHash,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.Users.AddAsync(user);
                await context.SaveChangesAsync();

                await context.UserRoles.AddAsync(new UserRole
                {
                    UserId = user.Id,
                    RoleId = spec.RoleId,
                    BranchId = spec.BranchScoped ? primaryBranchId : null
                });
                await context.SaveChangesAsync();

                if (spec.RoleId == Role.Driver)
                {
                    await context.Drivers.AddAsync(new Driver
                    {
                        TenantId = tenantId,
                        UserId = user.Id,
                        VehicleType = "MOTO",
                        LicensePlate = "PBA-4521",
                        IsAvailable = true,
                        CurrentLocation = GeometryFactory.CreatePoint(new Coordinate(-78.4845, -0.1782))
                    });
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
