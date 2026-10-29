using Delivery.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private const string DefaultDevPasswordHash = "$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";

    public static async Task SeedAsync(AppDbContext context)
    {
        // 1. Semilla de Tenant Principal (La Granjita Asadero)
        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == "la-granjita");

        if (tenant == null)
        {
            tenant = new Tenant
            {
                Slug = "la-granjita",
                Name = "La Granjita Asadero",
                BusinessName = "Asadero La Granjita Cia. Ltda.",
                TaxId = "1754455341001",
                BrandPrimaryColor = "#E4002B",
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
                SriEnvironment = "PRUEBAS"
            };

            await context.TenantSettings.AddAsync(settings);
            await context.SaveChangesAsync();
        }

        // 2. Semilla de Roles del Sistema
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

        // 3. Semilla de Sucursales y Geocercas PostGIS (con establecimientos SRI 001 y 002)
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

        // 4. Semilla de Usuarios Operativos (Admin, Cajero, Cocina, Repartidor)
        await SeedOperationalUsersAsync(context, tenant.Id, primaryBranch.Id);

        // 5. Semilla de Mesas de Salón para cada sucursal (Mesa 1 a Mesa 8)
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

        // 6. Semilla de Proveedor, Insumos con SKU y Kárdex Inicial por Sucursal
        await SeedInventoryAndSupplierAsync(context, tenant.Id, branches);

        // 7. Semilla de Categorías, Modificadores, Productos, Disponibilidad por Sucursal y Recetas
        await SeedCatalogAndRecipesAsync(context, tenant.Id, branches);

        // 8. Semilla de Cliente Frecuente para pruebas de POS / Checkout
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

    private static async Task SeedOperationalUsersAsync(AppDbContext context, Guid tenantId, int primaryBranchId)
    {
        var staffSpecs = new[]
        {
            (Email: "esmeralda@lagranjita.com", Name: "Esmeralda - Administradora", Phone: "0987654321", RoleId: Role.TenantAdmin, BranchScoped: false),
            (Email: "cajero@lagranjita.com", Name: "Cajero Principal Norte", Phone: "0987654323", RoleId: Role.Cashier, BranchScoped: true),
            (Email: "cocina@lagranjita.com", Name: "Maestro Hornero KDS", Phone: "0987654324", RoleId: Role.KitchenStaff, BranchScoped: true),
            (Email: "repartidor@lagranjita.com", Name: "Carlos Motorizado #1", Phone: "0987654325", RoleId: Role.Driver, BranchScoped: true)
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

    private static async Task SeedInventoryAndSupplierAsync(AppDbContext context, Guid tenantId, List<Branch> branches)
    {
        var supplier = await context.Suppliers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        if (supplier == null)
        {
            supplier = new Supplier
            {
                TenantId = tenantId,
                Name = "Avícola Procesadora Nacional S.A.",
                TaxId = "1790012345001",
                Phone = "022456789",
                Email = "pedidos@avicolanacional.ec",
                Address = "Panamericana Norte Km 14, Quito",
                IsActive = true
            };
            await context.Suppliers.AddAsync(supplier);
            await context.SaveChangesAsync();
        }

        foreach (var branch in branches)
        {
            if (!await context.InventoryItems.IgnoreQueryFilters().AnyAsync(i => i.BranchId == branch.Id))
            {
                var items = new List<InventoryItem>
                {
                    new()
                    {
                        TenantId = tenantId,
                        BranchId = branch.Id,
                        Sku = "INS-POLLO-OCT",
                        Name = "Pollo Crudo (Octavos)",
                        UnitOfMeasure = "OCTAVO",
                        CurrentStock = 400m,
                        MinAlertStock = 50m,
                        CostPrice = 0.73m,
                        IsActive = true
                    },
                    new()
                    {
                        TenantId = tenantId,
                        BranchId = branch.Id,
                        Sku = "INS-PAPA-5KG",
                        Name = "Papas Rústicas (Bolsa 5kg)",
                        UnitOfMeasure = "BOLSA",
                        CurrentStock = 50m,
                        MinAlertStock = 10m,
                        CostPrice = 3.50m,
                        IsActive = true
                    },
                    new()
                    {
                        TenantId = tenantId,
                        BranchId = branch.Id,
                        Sku = "INS-CONT-TERM",
                        Name = "Contenedor Térmico Para Llevar",
                        UnitOfMeasure = "UNIDAD",
                        CurrentStock = 1000m,
                        MinAlertStock = 200m,
                        CostPrice = 0.14m,
                        IsActive = true
                    }
                };

                await context.InventoryItems.AddRangeAsync(items);
                await context.SaveChangesAsync();

                var movements = items.Select(item => new InventoryMovement
                {
                    TenantId = tenantId,
                    InventoryItemId = item.Id,
                    SupplierId = supplier.Id,
                    MovementType = "COMPRA_PROVEEDOR",
                    QuantityDelta = item.CurrentStock,
                    StockBefore = 0m,
                    StockAfter = item.CurrentStock,
                    UnitCostSnapshot = item.CostPrice,
                    Notes = $"Carga inicial de inventario ({branch.Name})",
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                await context.InventoryMovements.AddRangeAsync(movements);
                await context.SaveChangesAsync();
            }
        }
    }

    private static async Task SeedCatalogAndRecipesAsync(AppDbContext context, Guid tenantId, List<Branch> branches)
    {
        if (!await context.Categories.IgnoreQueryFilters().AnyAsync(c => c.TenantId == tenantId))
        {
            var categories = new List<Category>
            {
                new() { TenantId = tenantId, Name = "Combos", DisplayOrder = 1, IsActive = true },
                new() { TenantId = tenantId, Name = "Porciones", DisplayOrder = 2, IsActive = true },
                new() { TenantId = tenantId, Name = "Extras", DisplayOrder = 3, IsActive = true },
                new() { TenantId = tenantId, Name = "Bebidas", DisplayOrder = 4, IsActive = true }
            };

            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        if (!await context.ModifierGroups.IgnoreQueryFilters().AnyAsync(mg => mg.TenantId == tenantId))
        {
            var guarnicionGroup = new ModifierGroup
            {
                TenantId = tenantId,
                Name = "Elección de Guarnición",
                MinSelectable = 1,
                MaxSelectable = 1,
                IsRequired = true,
                Options = new List<ModifierOption>
                {
                    new() { Name = "Papas Fritas Grandes", AdditionalPrice = 0.00m, IsAvailable = true },
                    new() { Name = "Menestra de Fréjol", AdditionalPrice = 0.00m, IsAvailable = true },
                    new() { Name = "Menestra de Lenteja", AdditionalPrice = 0.00m, IsAvailable = true },
                    new() { Name = "Yuca Frita Crujiente", AdditionalPrice = 0.50m, IsAvailable = true }
                }
            };

            var ajiGroup = new ModifierGroup
            {
                TenantId = tenantId,
                Name = "Tipo de Ají",
                MinSelectable = 1,
                MaxSelectable = 2,
                IsRequired = true,
                Options = new List<ModifierOption>
                {
                    new() { Name = "Ají Casero de la Casa (Picante medio)", AdditionalPrice = 0.00m, IsAvailable = true },
                    new() { Name = "Ají Tomate de Árbol (Picante suave)", AdditionalPrice = 0.00m, IsAvailable = true },
                    new() { Name = "Sin Ají", AdditionalPrice = 0.00m, IsAvailable = true }
                }
            };

            var bebidaGroup = new ModifierGroup
            {
                TenantId = tenantId,
                Name = "Bebidas Opcionales",
                MinSelectable = 0,
                MaxSelectable = 3,
                IsRequired = false,
                Options = new List<ModifierOption>
                {
                    new() { Name = "Gaseosa 1.5L (Manzana)", AdditionalPrice = 2.50m, IsAvailable = true },
                    new() { Name = "Gaseosa 1.5L (Cola Negra)", AdditionalPrice = 2.50m, IsAvailable = true },
                    new() { Name = "Jugo Natural de Maracuyá 1L", AdditionalPrice = 3.00m, IsAvailable = true }
                }
            };

            await context.ModifierGroups.AddRangeAsync(guarnicionGroup, ajiGroup, bebidaGroup);
            await context.SaveChangesAsync();

            if (!await context.Products.IgnoreQueryFilters().AnyAsync(p => p.TenantId == tenantId))
            {
                var combosCategory = await context.Categories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Name == "Combos" && c.TenantId == tenantId);
                var porcionesCategory = await context.Categories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Name == "Porciones" && c.TenantId == tenantId);

                var comboFamiliar = new Product
                {
                    TenantId = tenantId,
                    CategoryId = combosCategory?.Id,
                    Sku = "CMB-FAM-01",
                    Name = "Combo Familiar Completo",
                    Description = "1 Pollo Asado entero al carbón con guarnición grande, ensalada fresca y porciones de ají artesanal.",
                    BasePrice = 22.00m,
                    TaxRate = 0.00m,
                    ImageUrl = "/images/menu/combo-familiar.webp",
                    Category = "Combos",
                    IsKitchen = true,
                    IsActive = true
                };

                var medioPollo = new Product
                {
                    TenantId = tenantId,
                    CategoryId = porcionesCategory?.Id,
                    Sku = "POR-MED-01",
                    Name = "Medio Pollo Asado",
                    Description = "Medio pollo asado al carbón con papas fritas y ensalada.",
                    BasePrice = 11.50m,
                    TaxRate = 0.00m,
                    ImageUrl = "/images/menu/medio-pollo.webp",
                    Category = "Porciones",
                    IsKitchen = true,
                    IsActive = true
                };

                var cuartoPollo = new Product
                {
                    TenantId = tenantId,
                    CategoryId = porcionesCategory?.Id,
                    Sku = "POR-CUA-01",
                    Name = "Cuarto de Pollo Asado",
                    Description = "1 presa grande (pechuga o pierna) con papas fritas y ensalada personal.",
                    BasePrice = 6.00m,
                    TaxRate = 0.00m,
                    ImageUrl = "/images/menu/cuarto-pollo.webp",
                    Category = "Porciones",
                    IsKitchen = true,
                    IsActive = true
                };

                var products = new[] { comboFamiliar, medioPollo, cuartoPollo };
                await context.Products.AddRangeAsync(products);
                await context.SaveChangesAsync();

                var branchProducts = branches
                    .SelectMany(b => products.Select(p => new BranchProduct
                    {
                        TenantId = tenantId,
                        BranchId = b.Id,
                        ProductId = p.Id,
                        IsAvailable = true
                    })).ToList();

                await context.BranchProducts.AddRangeAsync(branchProducts);
                await context.SaveChangesAsync();

                var links = new List<ProductModifierGroup>
                {
                    new() { ProductId = comboFamiliar.Id, ModifierGroupId = guarnicionGroup.Id },
                    new() { ProductId = comboFamiliar.Id, ModifierGroupId = ajiGroup.Id },
                    new() { ProductId = comboFamiliar.Id, ModifierGroupId = bebidaGroup.Id },
                    new() { ProductId = medioPollo.Id, ModifierGroupId = guarnicionGroup.Id },
                    new() { ProductId = medioPollo.Id, ModifierGroupId = ajiGroup.Id },
                    new() { ProductId = cuartoPollo.Id, ModifierGroupId = guarnicionGroup.Id },
                    new() { ProductId = cuartoPollo.Id, ModifierGroupId = ajiGroup.Id }
                };

                await context.ProductModifierGroups.AddRangeAsync(links);
                await context.SaveChangesAsync();

                var primaryBranchId = branches[0].Id;
                var polloInsumo = await context.InventoryItems.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(i => i.BranchId == primaryBranchId && i.Sku == "INS-POLLO-OCT");
                var contenedorInsumo = await context.InventoryItems.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(i => i.BranchId == primaryBranchId && i.Sku == "INS-CONT-TERM");

                if (polloInsumo != null)
                {
                    var recipes = new List<ProductRecipe>
                    {
                        new() { ProductId = comboFamiliar.Id, InventoryItemId = polloInsumo.Id, QuantityUsed = 8m },
                        new() { ProductId = medioPollo.Id, InventoryItemId = polloInsumo.Id, QuantityUsed = 4m },
                        new() { ProductId = cuartoPollo.Id, InventoryItemId = polloInsumo.Id, QuantityUsed = 2m }
                    };

                    if (contenedorInsumo != null)
                    {
                        recipes.Add(new() { ProductId = comboFamiliar.Id, InventoryItemId = contenedorInsumo.Id, QuantityUsed = 1m });
                        recipes.Add(new() { ProductId = medioPollo.Id, InventoryItemId = contenedorInsumo.Id, QuantityUsed = 1m });
                        recipes.Add(new() { ProductId = cuartoPollo.Id, InventoryItemId = contenedorInsumo.Id, QuantityUsed = 1m });
                    }

                    await context.ProductRecipes.AddRangeAsync(recipes);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
