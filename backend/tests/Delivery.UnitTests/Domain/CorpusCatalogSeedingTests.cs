using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Core.Infrastructure.Persistence.Corpus;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Delivery.UnitTests.Domain;

public class CorpusCatalogSeedingTests
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
    public void CorpusCatalogLoader_ShouldLoadLaGranjitaCorpusSuccessfully()
    {
        var corpus = CorpusCatalogLoader.Load("la-granjita");

        corpus.Should().NotBeNull();
        corpus!.TenantSlug.Should().Be("la-granjita");
        corpus.Categories.Should().Contain(c => c.Name == "Combos");
        corpus.Categories.Should().Contain(c => c.Name == "Porciones");
        corpus.Products.Should().Contain(p => p.Sku == "CMB-FAM-01" && p.BasePrice == 22.00m);
        corpus.ModifierGroups.Should().Contain(mg => mg.Name == "Elección de Guarnición");
    }

    [Fact]
    public void CorpusCatalogLoader_ShouldLoadBrasasDelValleCorpusSuccessfully()
    {
        var corpus = CorpusCatalogLoader.Load("brasas-del-valle");

        corpus.Should().NotBeNull();
        corpus!.TenantSlug.Should().Be("brasas-del-valle");
        corpus.Categories.Should().Contain(c => c.Name == "Parrilladas");
        corpus.Products.Should().Contain(p => p.Sku == "PAR-IMP-01" && p.BasePrice == 34.50m);
        corpus.ModifierGroups.Should().Contain(mg => mg.Name == "Término de Cocción");
    }

    [Fact]
    public void CorpusCatalogLoader_ShouldReturnNull_WhenSlugDoesNotExist()
    {
        var corpus = CorpusCatalogLoader.Load("slug-completamente-inexistente-xyz");
        corpus.Should().BeNull();
    }

    [Fact]
    public async Task SeedCatalogFromCorpusAsync_ShouldSeedAllEntitiesIdempotently()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var tenantContext = new FakeTenantContext { TenantId = tenantId, TenantSlug = "la-granjita" };

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName), tenantContext);

        var geometryFactory = new NetTopologySuite.Geometries.GeometryFactory(new NetTopologySuite.Geometries.PrecisionModel(), 4326);
        var branch = new Branch
        {
            Id = 1,
            TenantId = tenantId,
            Name = "Matriz Test",
            Address = "Av. Principal",
            Phone = "0990001122",
            LocationPoint = geometryFactory.CreatePoint(new NetTopologySuite.Geometries.Coordinate(-78.4845, -0.1782)),
            CoveragePolygon = geometryFactory.CreatePolygon(new[]
            {
                new NetTopologySuite.Geometries.Coordinate(-78.50, -0.20),
                new NetTopologySuite.Geometries.Coordinate(-78.46, -0.20),
                new NetTopologySuite.Geometries.Coordinate(-78.46, -0.16),
                new NetTopologySuite.Geometries.Coordinate(-78.50, -0.16),
                new NetTopologySuite.Geometries.Coordinate(-78.50, -0.20)
            }),
            SriEstablishmentCode = "001",
            OpeningTime = "10:00",
            ClosingTime = "22:00",
            IsActive = true
        };
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var branches = new List<Branch> { branch };

        // 1. Primera ejecución: debe poblar la base de datos
        var firstResult = await DatabaseSeeder.SeedCatalogFromCorpusAsync(context, tenantId, "la-granjita", branches);
        firstResult.Should().BeTrue();

        var initialCategories = await context.Categories.IgnoreQueryFilters().Where(c => c.TenantId == tenantId).ToListAsync();
        var initialProducts = await context.Products.IgnoreQueryFilters().Where(p => p.TenantId == tenantId).ToListAsync();
        var initialBranchProducts = await context.BranchProducts.IgnoreQueryFilters().Where(bp => bp.TenantId == tenantId).ToListAsync();
        var initialModifierGroups = await context.ModifierGroups.IgnoreQueryFilters().Where(mg => mg.TenantId == tenantId).ToListAsync();

        initialCategories.Should().NotBeEmpty();
        initialProducts.Should().NotBeEmpty();
        initialBranchProducts.Count.Should().Be(initialProducts.Count);
        initialModifierGroups.Should().NotBeEmpty();

        // 2. Segunda ejecución: no debe duplicar ni lanzar excepciones (idempotencia estricta)
        var secondResult = await DatabaseSeeder.SeedCatalogFromCorpusAsync(context, tenantId, "la-granjita", branches);
        secondResult.Should().BeTrue();

        var finalCategories = await context.Categories.IgnoreQueryFilters().Where(c => c.TenantId == tenantId).ToListAsync();
        var finalProducts = await context.Products.IgnoreQueryFilters().Where(p => p.TenantId == tenantId).ToListAsync();
        var finalBranchProducts = await context.BranchProducts.IgnoreQueryFilters().Where(bp => bp.TenantId == tenantId).ToListAsync();
        var finalModifierGroups = await context.ModifierGroups.IgnoreQueryFilters().Where(mg => mg.TenantId == tenantId).ToListAsync();

        finalCategories.Count.Should().Be(initialCategories.Count);
        finalProducts.Count.Should().Be(initialProducts.Count);
        finalBranchProducts.Count.Should().Be(initialBranchProducts.Count);
        finalModifierGroups.Count.Should().Be(initialModifierGroups.Count);
    }
}
