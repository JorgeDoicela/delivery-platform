using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Xunit;

namespace Delivery.UnitTests.Domain;

public class MultitenantDatabaseTests
{
    private sealed class FakeTenantContext : ITenantContext
    {
        public Guid? TenantId { get; set; }
        public string? TenantSlug { get; set; }
        public bool IsResolved => TenantId.HasValue;
    }

    private static DbContextOptions<AppDbContext> CreateInMemoryOptions(string dbName)
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
    }

    [Fact]
    public async Task SaveChangesAsync_ShouldAutoAssignTenantId_WhenEntityImplementsIMustHaveTenant()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var tenantContext = new FakeTenantContext { TenantId = tenantId, TenantSlug = "la-granjita" };

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName), tenantContext);

        var category = new Category
        {
            Name = "Especiales",
            DisplayOrder = 1
        };

        await context.Categories.AddAsync(category);
        await context.SaveChangesAsync();

        category.TenantId.Should().Be(tenantId);
    }

    [Fact]
    public async Task GlobalQueryFilters_ShouldIsolateEntitiesBetweenTenants()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var gf = new GeometryFactory(new PrecisionModel(), 4326);

        // Insert data without filter
        await using (var setupCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await setupCtx.Categories.AddRangeAsync(
                new Category { TenantId = tenantA, Name = "Pollos Tenant A" },
                new Category { TenantId = tenantB, Name = "Costillas Tenant B" }
            );

            await setupCtx.Branches.AddRangeAsync(
                new Branch
                {
                    TenantId = tenantA,
                    Name = "Sucursal Tenant A",
                    LocationPoint = gf.CreatePoint(new Coordinate(-78.48, -0.17)),
                    CoveragePolygon = gf.CreatePolygon(new[]
                    {
                        new Coordinate(-78.51, -0.15),
                        new Coordinate(-78.46, -0.15),
                        new Coordinate(-78.46, -0.20),
                        new Coordinate(-78.51, -0.20),
                        new Coordinate(-78.51, -0.15)
                    })
                },
                new Branch
                {
                    TenantId = tenantB,
                    Name = "Sucursal Tenant B",
                    LocationPoint = gf.CreatePoint(new Coordinate(-78.51, -0.23)),
                    CoveragePolygon = gf.CreatePolygon(new[]
                    {
                        new Coordinate(-78.54, -0.20),
                        new Coordinate(-78.49, -0.20),
                        new Coordinate(-78.49, -0.26),
                        new Coordinate(-78.54, -0.26),
                        new Coordinate(-78.54, -0.20)
                    })
                }
            );

            await setupCtx.SaveChangesAsync();
        }

        // Query scoped to Tenant A
        await using (var ctxA = new AppDbContext(CreateInMemoryOptions(dbName), new FakeTenantContext { TenantId = tenantA }))
        {
            var categoriesA = await ctxA.Categories.ToListAsync();
            var branchesA = await ctxA.Branches.ToListAsync();

            categoriesA.Should().ContainSingle(c => c.Name == "Pollos Tenant A");
            branchesA.Should().ContainSingle(b => b.Name == "Sucursal Tenant A");
        }

        // Query scoped to Tenant B
        await using (var ctxB = new AppDbContext(CreateInMemoryOptions(dbName), new FakeTenantContext { TenantId = tenantB }))
        {
            var categoriesB = await ctxB.Categories.ToListAsync();
            var branchesB = await ctxB.Branches.ToListAsync();

            categoriesB.Should().ContainSingle(c => c.Name == "Costillas Tenant B");
            branchesB.Should().ContainSingle(b => b.Name == "Sucursal Tenant B");
        }
    }

    [Fact]
    public async Task DatabaseSeeder_ShouldSeedCompleteMultitenantDataIdempotently()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));

        // First execution
        await DatabaseSeeder.SeedAsync(context);
        // Second execution to verify idempotency
        await DatabaseSeeder.SeedAsync(context);

        (await context.Tenants.CountAsync()).Should().Be(3); // la-granjita, brasas-del-valle, el-lenador
        (await context.TenantSettings.CountAsync()).Should().Be(3);
        (await context.Roles.CountAsync()).Should().Be(7);

        var laGranjita = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var brasas = await context.Tenants.FirstAsync(t => t.Slug == "brasas-del-valle");
        var lenador = await context.Tenants.FirstAsync(t => t.Slug == "el-lenador");

        laGranjita.BrandPrimaryColor.Should().Be("#E4002B");
        brasas.BrandPrimaryColor.Should().Be("#047857");
        lenador.BrandPrimaryColor.Should().Be("#EA580C");

        (await context.Branches.CountAsync(b => b.TenantId == laGranjita.Id)).Should().Be(2);
        (await context.Branches.CountAsync(b => b.TenantId == brasas.Id)).Should().Be(1);
        (await context.Branches.CountAsync(b => b.TenantId == lenador.Id)).Should().Be(1);
        (await context.DiningTables.CountAsync(dt => dt.TenantId == laGranjita.Id)).Should().Be(16);
        (await context.Products.CountAsync(p => p.TenantId == laGranjita.Id)).Should().Be(3);
        (await context.Products.CountAsync(p => p.TenantId == brasas.Id)).Should().Be(3);
        (await context.Products.CountAsync(p => p.TenantId == lenador.Id)).Should().Be(3);
        (await context.Customers.CountAsync(c => c.TenantId == laGranjita.Id)).Should().Be(1);
    }
}
