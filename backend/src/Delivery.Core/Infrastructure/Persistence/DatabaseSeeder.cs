using Delivery.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    public static async Task SeedAsync(AppDbContext context)
    {
        // 1. Semilla de Sucursales y Geocercas (si no existen)
        if (!await context.Branches.AnyAsync())
        {
            // Sucursal 1 (Norte) - Coordenadas WGS84 (Lng, Lat)
            var branch1Location = GeometryFactory.CreatePoint(new Coordinate(-78.4845, -0.1782));
            var branch1Polygon = GeometryFactory.CreatePolygon(new[]
            {
                new Coordinate(-78.5100, -0.1500),
                new Coordinate(-78.4600, -0.1500),
                new Coordinate(-78.4600, -0.2000),
                new Coordinate(-78.5100, -0.2000),
                new Coordinate(-78.5100, -0.1500)
            });

            // Sucursal 2 (Sur/Centro) - Coordenadas WGS84 (Lng, Lat)
            var branch2Location = GeometryFactory.CreatePoint(new Coordinate(-78.5180, -0.2300));
            var branch2Polygon = GeometryFactory.CreatePolygon(new[]
            {
                new Coordinate(-78.5400, -0.2001),
                new Coordinate(-78.4900, -0.2001),
                new Coordinate(-78.4900, -0.2600),
                new Coordinate(-78.5400, -0.2600),
                new Coordinate(-78.5400, -0.2001)
            });

            var branches = new List<Branch>
            {
                new()
                {
                    Name = "Sucursal #1 (Norte)",
                    Address = "Av. Amazonas y República (Edif. Sky)",
                    Phone = "0987654321",
                    LocationPoint = branch1Location,
                    CoveragePolygon = branch1Polygon,
                    MaxOrdersPerSlot = 15,
                    IsActive = true
                },
                new()
                {
                    Name = "Sucursal #2 (Sur)",
                    Address = "Av. Rodrigo de Chávez y Maldonado",
                    Phone = "0987654322",
                    LocationPoint = branch2Location,
                    CoveragePolygon = branch2Polygon,
                    MaxOrdersPerSlot = 15,
                    IsActive = true
                }
            };

            await context.Branches.AddRangeAsync(branches);
            await context.SaveChangesAsync();
        }

        // 2. Semilla de Modificadores (Guarniciones, Ají, Bebidas)
        if (!await context.ModifierGroups.AnyAsync())
        {
            var guarnicionGroup = new ModifierGroup
            {
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

            // 3. Semilla de Productos y Catálogo
            if (!await context.Products.AnyAsync())
            {
                var comboFamiliar = new Product
                {
                    Name = "Combo Familiar Completo",
                    Description = "1 Pollo Asado entero al carbón con guarnición grande, ensalada fresca y porciones de ají artesanal.",
                    BasePrice = 22.00m,
                    ImageUrl = "/images/menu/combo-familiar.webp",
                    Category = "Combos",
                    IsActive = true
                };

                var medioPollo = new Product
                {
                    Name = "Medio Pollo Asado",
                    Description = "Medio pollo asado al carbón con papas fritas y ensalada.",
                    BasePrice = 11.50m,
                    ImageUrl = "/images/menu/medio-pollo.webp",
                    Category = "Porciones",
                    IsActive = true
                };

                var cuartoPollo = new Product
                {
                    Name = "Cuarto de Pollo Asado",
                    Description = "1 presa grande (pechuga o pierna) con papas fritas y ensalada personal.",
                    BasePrice = 6.00m,
                    ImageUrl = "/images/menu/cuarto-pollo.webp",
                    Category = "Porciones",
                    IsActive = true
                };

                await context.Products.AddRangeAsync(comboFamiliar, medioPollo, cuartoPollo);
                await context.SaveChangesAsync();

                // Asociar modificadores a los productos
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
            }
        }
    }
}
