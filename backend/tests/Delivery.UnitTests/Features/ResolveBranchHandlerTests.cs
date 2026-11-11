using Delivery.Core.Common.Spatial;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Branches.ResolveBranch;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Xunit;

namespace Delivery.UnitTests.Features;

public class ResolveBranchHandlerTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public void HaversineCalculator_CalculatesKnownGeodesicDistancePrecisely()
    {
        // Guamaní (-0.33228, -78.55708) a Carcelén (-0.09400, -78.47300) en Quito
        var distanceKm = HaversineCalculator.CalculateDistanceKm(-0.33228, -78.55708, -0.09400, -78.47300);

        // Distancia geodésica real en Quito es aproximadamente 28 km
        distanceKm.Should().BeInRange(27.0, 29.0);
    }

    [Theory]
    [InlineData(91.0, 0.0)]
    [InlineData(-91.0, 0.0)]
    [InlineData(0.0, 181.0)]
    [InlineData(0.0, -181.0)]
    public async Task Handle_WithInvalidCoordinates_ShouldReturnInvalidCoordinatesError(double latitude, double longitude)
    {
        using var context = CreateInMemoryDbContext();
        var handler = new ResolveBranchHandler(context, new ResolveBranchValidator());

        var result = await handler.Handle(new ResolveBranchQuery(latitude, longitude));

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Geofencing.InvalidCoordinates");
    }

    [Fact]
    public async Task Handle_WhenPointIsOutsideAnyBranchCoverage_ShouldReturnOutsideCoverageError()
    {
        using var context = CreateInMemoryDbContext();
        var handler = new ResolveBranchHandler(context, new ResolveBranchValidator());

        var result = await handler.Handle(new ResolveBranchQuery(-0.1800, -78.4800));

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Geofencing.OutsideCoverage");
    }

    [Fact]
    public async Task Handle_WhenPointIsWithinDeliveryRadiusKm_ShouldResolveBranchSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();

        var branchLocation = GeometryFactory.CreatePoint(new Coordinate(-78.55708, -0.33228));
        var dummyPolygon = GeometryFactory.CreatePolygon(new[]
        {
            new Coordinate(-78.50, -0.30),
            new Coordinate(-78.49, -0.30),
            new Coordinate(-78.49, -0.31),
            new Coordinate(-78.50, -0.31),
            new Coordinate(-78.50, -0.30)
        });

        var branch = new Branch
        {
            TenantId = tenantId,
            Name = "Matriz Guamaní",
            Address = "Av. Maldonado",
            Phone = "0987654321",
            LocationPoint = branchLocation,
            CoveragePolygon = dummyPolygon,
            DeliveryRadiusKm = 35.0, // Cubre hasta 35 km con Haversine
            IsCoverageStrict = true,
            IsActive = true
        };

        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new ResolveBranchHandler(context, new ResolveBranchValidator());

        // Coordenada en Quito Centro (-0.20, -78.49), a aprox 16 km de Guamaní
        var result = await handler.Handle(new ResolveBranchQuery(-0.2000, -78.4900));

        result.IsSuccess.Should().BeTrue();
        result.Value.BranchId.Should().Be(branch.Id);
        result.Value.DistanceKm.Should().BeInRange(14.0, 18.0);
        result.Value.IsDirectCoverage.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenCoverageValidationIsDisabled_ShouldAssignClosestBranchEvenOutsideRadius()
    {
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();

        var settings = new TenantSetting
        {
            TenantId = tenantId,
            RequireCoverageValidation = false // Cobertura opcional / flexible
        };
        await context.TenantSettings.AddAsync(settings);

        var branchLocation = GeometryFactory.CreatePoint(new Coordinate(-78.55708, -0.33228));
        var dummyPolygon = GeometryFactory.CreatePolygon(new[]
        {
            new Coordinate(-78.56, -0.33),
            new Coordinate(-78.55, -0.33),
            new Coordinate(-78.55, -0.34),
            new Coordinate(-78.56, -0.34),
            new Coordinate(-78.56, -0.33)
        });

        var branch = new Branch
        {
            TenantId = tenantId,
            Name = "Sede Flexible",
            Address = "Quito",
            Phone = "0987654321",
            LocationPoint = branchLocation,
            CoveragePolygon = dummyPolygon,
            DeliveryRadiusKm = 5.0, // Radio pequeño de 5 km
            IsCoverageStrict = false,
            IsActive = true
        };

        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new ResolveBranchHandler(context, new ResolveBranchValidator());

        // Punto a 20 km de distancia
        var result = await handler.Handle(new ResolveBranchQuery(-0.1800, -78.4800));

        result.IsSuccess.Should().BeTrue();
        result.Value.BranchId.Should().Be(branch.Id);
        result.Value.IsDirectCoverage.Should().BeFalse();
    }
}
