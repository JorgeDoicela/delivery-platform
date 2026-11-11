using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence.Corpus;
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
                Name = "Avícola La Pradera S.A.",
                TaxId = "1792003571001",
                Phone = "022331122",
                Email = "pedidos@lapradera.ec",
                Address = "Av. General Rumiñahui, Sangolquí, Pichincha",
                IsActive = true
            };
            await context.Suppliers.AddAsync(supplier);
            await context.SaveChangesAsync();
        }

        var catalogSpecs = new (string Sku, string Name, string Unit, decimal Stock, decimal MinStock, decimal Cost)[]
        {
            ("INS-POLLO-OCT", "Pollo Crudo (Octavos)", "OCTAVO", 500m, 50m, 0.73m),
            ("INS-CONT-TERM", "Contenedor Térmico Para Llevar", "UNIDAD", 1000m, 200m, 0.14m),
            ("INS-BEB-COLA-PERS-VID", "Cola Personal (Botella Vidrio)", "UNIDAD", 240m, 48m, 0.23m),
            ("INS-BEB-COLA-PERS-PET", "Cola Personal (Plástico PET)", "UNIDAD", 240m, 48m, 0.21m),
            ("INS-BEB-COLA-MED", "Cola Mediana 500ml", "UNIDAD", 120m, 24m, 0.50m),
            ("INS-BEB-COLA-1L", "Cola 1 Litro", "UNIDAD", 100m, 20m, 0.75m),
            ("INS-BEB-COLA-2L", "Cola Familiar 2 Litros", "UNIDAD", 80m, 16m, 3.83m),
            ("INS-SALCHICHA", "Salchicha Especial", "UNIDAD", 300m, 50m, 0.22m),
            ("INS-HUEVO", "Huevo Fresco de Granja", "UNIDAD", 360m, 60m, 0.125m),
            ("INS-AGUA", "Agua Purificada Personal", "UNIDAD", 150m, 30m, 0.25m),
            ("INS-TARRINA-GRANDE", "Tarrina Grande Térmica (TG)", "UNIDAD", 500m, 100m, 0.05m),
            ("INS-PAPA-5KG", "Papas Seleccionadas (Bolsa 5kg)", "BOLSA", 50m, 10m, 3.50m)
        };

        foreach (var branch in branches)
        {
            var existingItems = await context.InventoryItems.IgnoreQueryFilters()
                .Where(i => i.BranchId == branch.Id)
                .ToListAsync();

            var existingBySku = existingItems.ToDictionary(i => i.Sku, StringComparer.OrdinalIgnoreCase);
            var newItems = new List<InventoryItem>();

            foreach (var spec in catalogSpecs)
            {
                if (!existingBySku.TryGetValue(spec.Sku, out var item))
                {
                    item = new InventoryItem
                    {
                        TenantId = tenantId,
                        BranchId = branch.Id,
                        Sku = spec.Sku,
                        Name = spec.Name,
                        UnitOfMeasure = spec.Unit,
                        CurrentStock = spec.Stock,
                        MinAlertStock = spec.MinStock,
                        CostPrice = spec.Cost,
                        IsActive = true
                    };
                    newItems.Add(item);
                }
            }

            if (newItems.Count > 0)
            {
                await context.InventoryItems.AddRangeAsync(newItems);
                await context.SaveChangesAsync();

                var movements = newItems.Select(item => new InventoryMovement
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
                    Notes = $"Carga inicial de inventario real ({branch.Name})",
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                await context.InventoryMovements.AddRangeAsync(movements);
                await context.SaveChangesAsync();
            }
        }
    }

    /// <summary>
    /// Ingesta declarativa e idempotente de catálogo (categorías, modificadores, productos y recetas)
    /// utilizando el Corpus JSON estructurado por marca.
    /// </summary>
    public static async Task<bool> SeedCatalogFromCorpusAsync(
        AppDbContext context,
        Guid tenantId,
        string tenantSlug,
        List<Branch> branches)
    {
        var corpus = CorpusCatalogLoader.Load(tenantSlug);
        if (corpus == null || corpus.Products.Count == 0)
        {
            return false;
        }

        // 1. Categorías Idempotentes
        var existingCategories = await context.Categories
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == tenantId)
            .ToListAsync();

        var categoriesByName = existingCategories.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);

        foreach (var catSpec in corpus.Categories)
        {
            if (!categoriesByName.TryGetValue(catSpec.Name, out var existingCategory))
            {
                var newCat = new Category
                {
                    TenantId = tenantId,
                    Name = catSpec.Name,
                    DisplayOrder = catSpec.DisplayOrder,
                    IsActive = catSpec.IsActive
                };
                await context.Categories.AddAsync(newCat);
                categoriesByName[catSpec.Name] = newCat;
            }
            else
            {
                existingCategory.DisplayOrder = catSpec.DisplayOrder;
                existingCategory.IsActive = catSpec.IsActive;
            }
        }
        await context.SaveChangesAsync();

        // 2. Grupos de Modificadores y Opciones Idempotentes
        var existingModifierGroups = await context.ModifierGroups
            .IgnoreQueryFilters()
            .Include(mg => mg.Options)
            .Where(mg => mg.TenantId == tenantId)
            .ToListAsync();

        var groupsByName = existingModifierGroups.ToDictionary(mg => mg.Name, StringComparer.OrdinalIgnoreCase);

        foreach (var mgSpec in corpus.ModifierGroups)
        {
            if (!groupsByName.TryGetValue(mgSpec.Name, out var groupEntity))
            {
                groupEntity = new ModifierGroup
                {
                    TenantId = tenantId,
                    Name = mgSpec.Name,
                    MinSelectable = mgSpec.MinSelectable,
                    MaxSelectable = mgSpec.MaxSelectable,
                    IsRequired = mgSpec.IsRequired,
                    Options = mgSpec.Options.Select(opt => new ModifierOption
                    {
                        Name = opt.Name,
                        AdditionalPrice = opt.AdditionalPrice,
                        IsAvailable = opt.IsAvailable
                    }).ToList()
                };
                await context.ModifierGroups.AddAsync(groupEntity);
                groupsByName[mgSpec.Name] = groupEntity;
            }
            else
            {
                groupEntity.MinSelectable = mgSpec.MinSelectable;
                groupEntity.MaxSelectable = mgSpec.MaxSelectable;
                groupEntity.IsRequired = mgSpec.IsRequired;

                var existingOptionNames = new HashSet<string>(
                    groupEntity.Options.Select(o => o.Name),
                    StringComparer.OrdinalIgnoreCase
                );

                foreach (var opt in mgSpec.Options)
                {
                    if (!existingOptionNames.Contains(opt.Name))
                    {
                        var newOpt = new ModifierOption
                        {
                            ModifierGroupId = groupEntity.Id,
                            Name = opt.Name,
                            AdditionalPrice = opt.AdditionalPrice,
                            IsAvailable = opt.IsAvailable
                        };
                        groupEntity.Options.Add(newOpt);
                        await context.ModifierOptions.AddAsync(newOpt);
                    }
                }
            }
        }
        await context.SaveChangesAsync();

        // 3. Productos Idempotentes
        var existingProducts = await context.Products
            .IgnoreQueryFilters()
            .Include(p => p.ProductModifierGroups)
            .Where(p => p.TenantId == tenantId)
            .ToListAsync();

        var productsBySku = existingProducts.ToDictionary(p => p.Sku, StringComparer.OrdinalIgnoreCase);

        foreach (var prodSpec in corpus.Products)
        {
            categoriesByName.TryGetValue(prodSpec.Category, out var cat);

            if (!productsBySku.TryGetValue(prodSpec.Sku, out var prodEntity))
            {
                prodEntity = new Product
                {
                    TenantId = tenantId,
                    CategoryId = cat?.Id,
                    Sku = prodSpec.Sku,
                    Name = prodSpec.Name,
                    Description = prodSpec.Description,
                    BasePrice = prodSpec.BasePrice,
                    TaxRate = prodSpec.TaxRate,
                    ImageUrl = prodSpec.ImageUrl,
                    Category = prodSpec.Category,
                    IsKitchen = prodSpec.IsKitchen,
                    IsActive = prodSpec.IsActive
                };

                await context.Products.AddAsync(prodEntity);
                productsBySku[prodSpec.Sku] = prodEntity;
            }
            else
            {
                // Sincronizar atributos actualizados del corpus
                prodEntity.CategoryId = cat?.Id ?? prodEntity.CategoryId;
                prodEntity.Name = prodSpec.Name;
                prodEntity.Description = prodSpec.Description;
                prodEntity.BasePrice = prodSpec.BasePrice;
                prodEntity.TaxRate = prodSpec.TaxRate;
                prodEntity.ImageUrl = prodSpec.ImageUrl;
                prodEntity.Category = prodSpec.Category;
                prodEntity.IsKitchen = prodSpec.IsKitchen;
                prodEntity.IsActive = prodSpec.IsActive;
            }
        }
        await context.SaveChangesAsync();

        // 4. Enlaces de Sucursal (BranchProduct)
        if (branches.Count > 0)
        {
            var branchIds = branches.Select(b => b.Id).ToList();
            var existingBranchProductKeys = await context.BranchProducts
                .IgnoreQueryFilters()
                .Where(bp => bp.TenantId == tenantId && branchIds.Contains(bp.BranchId))
                .Select(bp => $"{bp.BranchId}_{bp.ProductId}")
                .ToListAsync();

            var branchProductSet = new HashSet<string>(existingBranchProductKeys);
            var newBranchProducts = new List<BranchProduct>();

            foreach (var branch in branches)
            {
                foreach (var prod in productsBySku.Values)
                {
                    var key = $"{branch.Id}_{prod.Id}";
                    if (!branchProductSet.Contains(key))
                    {
                        newBranchProducts.Add(new BranchProduct
                        {
                            TenantId = tenantId,
                            BranchId = branch.Id,
                            ProductId = prod.Id,
                            IsAvailable = true
                        });
                        branchProductSet.Add(key);
                    }
                }
            }

            if (newBranchProducts.Count > 0)
            {
                await context.BranchProducts.AddRangeAsync(newBranchProducts);
                await context.SaveChangesAsync();
            }
        }

        // 5. Enlaces de Modificadores (ProductModifierGroup)
        var productIds = productsBySku.Values.Select(p => p.Id).ToList();
        var existingModifierLinks = await context.ProductModifierGroups
            .Where(pmg => productIds.Contains(pmg.ProductId))
            .Select(pmg => $"{pmg.ProductId}_{pmg.ModifierGroupId}")
            .ToListAsync();

        var linkSet = new HashSet<string>(existingModifierLinks);
        var newModifierLinks = new List<ProductModifierGroup>();

        foreach (var prodSpec in corpus.Products)
        {
            if (productsBySku.TryGetValue(prodSpec.Sku, out var product))
            {
                foreach (var groupName in prodSpec.ModifierGroups)
                {
                    if (groupsByName.TryGetValue(groupName, out var modGroup))
                    {
                        var key = $"{product.Id}_{modGroup.Id}";
                        if (!linkSet.Contains(key))
                        {
                            newModifierLinks.Add(new ProductModifierGroup
                            {
                                ProductId = product.Id,
                                ModifierGroupId = modGroup.Id
                            });
                            linkSet.Add(key);
                        }
                    }
                }
            }
        }

        if (newModifierLinks.Count > 0)
        {
            await context.ProductModifierGroups.AddRangeAsync(newModifierLinks);
            await context.SaveChangesAsync();
        }

        // 6. Recetas de Inventario (ProductRecipe) si la sucursal matriz cuenta con insumos
        if (branches.Count > 0)
        {
            var primaryBranchId = branches[0].Id;
            var inventoryItems = await context.InventoryItems
                .IgnoreQueryFilters()
                .Where(i => i.BranchId == primaryBranchId)
                .ToListAsync();

            var inventoryBySku = inventoryItems.ToDictionary(i => i.Sku, StringComparer.OrdinalIgnoreCase);

            var existingRecipes = await context.ProductRecipes
                .Where(pr => productIds.Contains(pr.ProductId))
                .ToListAsync();

            var recipeMap = existingRecipes.ToDictionary(pr => $"{pr.ProductId}_{pr.InventoryItemId}");
            var newRecipes = new List<ProductRecipe>();

            foreach (var prodSpec in corpus.Products)
            {
                if (productsBySku.TryGetValue(prodSpec.Sku, out var product) && prodSpec.Recipes is { Count: > 0 })
                {
                    foreach (var recipeSpec in prodSpec.Recipes)
                    {
                        if (inventoryBySku.TryGetValue(recipeSpec.InventorySku, out var item))
                        {
                            var key = $"{product.Id}_{item.Id}";
                            if (recipeMap.TryGetValue(key, out var existingRec))
                            {
                                existingRec.QuantityUsed = recipeSpec.QuantityUsed;
                            }
                            else
                            {
                                var newRecipe = new ProductRecipe
                                {
                                    ProductId = product.Id,
                                    InventoryItemId = item.Id,
                                    QuantityUsed = recipeSpec.QuantityUsed
                                };
                                newRecipes.Add(newRecipe);
                                recipeMap[key] = newRecipe;
                            }
                        }
                    }
                }
            }

            if (newRecipes.Count > 0)
            {
                await context.ProductRecipes.AddRangeAsync(newRecipes);
            }
            await context.SaveChangesAsync();
        }

        return true;
    }

    private static async Task SeedCatalogAndRecipesAsync(
        AppDbContext context,
        Guid tenantId,
        List<Branch> branches,
        string tenantSlug = "la-granjita")
    {
        // 1. Prioriza la ingesta declarativa desde el corpus estructurado
        var seededFromCorpus = await SeedCatalogFromCorpusAsync(context, tenantId, tenantSlug, branches);
        if (seededFromCorpus)
        {
            return;
        }

        // 2. Fallback estático en memoria si el corpus no está disponible
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
                MinSelectable = 0,
                MaxSelectable = 1,
                IsRequired = false,
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
                MinSelectable = 0,
                MaxSelectable = 2,
                IsRequired = false,
                Options = new List<ModifierOption>
                {
                    new() { Name = "Ají Casero de la Casa (Picante medio)", AdditionalPrice = 0.00m, IsAvailable = true },
                    new() { Name = "Ají Tomate de Árbol (Picante suave)", AdditionalPrice = 0.00m, IsAvailable = true }
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
                    ImageUrl = "/images/tenants/la-granjita/menu/combo-familiar.webp",
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
                    ImageUrl = "/images/tenants/la-granjita/menu/medio-pollo.webp",
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
                    ImageUrl = "/images/tenants/la-granjita/menu/cuarto-pollo.webp",
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
