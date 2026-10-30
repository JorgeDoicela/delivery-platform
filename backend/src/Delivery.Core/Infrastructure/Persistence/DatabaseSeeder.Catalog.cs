using Delivery.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Core.Infrastructure.Persistence;

public static partial class DatabaseSeeder
{
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
                    BranchId = branch.Id,
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

