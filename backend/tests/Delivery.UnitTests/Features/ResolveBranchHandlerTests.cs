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

    [Theory]
    [InlineData(91.0, 0.0)]
    [InlineData(-91.0, 0.0)]
    [InlineData(0.0, 181.0)]
    [InlineData(0.0, -181.0)]
    public async Task Handle_WithInvalidCoordinates_ShouldReturnInvalidCoordinatesError(double latitude, double longitude)
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new ResolveBranchHandler(context, new ResolveBranchValidator());

        // Act
        var result = await handler.Handle(new ResolveBranchQuery(latitude, longitude));

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Geofencing.InvalidCoordinates");
    }

    [Fact]
    public async Task Handle_WhenPointIsOutsideAnyBranchCoverage_ShouldReturnOutsideCoverageError()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new ResolveBranchHandler(context, new ResolveBranchValidator());

        // Act
        var result = await handler.Handle(new ResolveBranchQuery(-0.1800, -78.4800));

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Geofencing.OutsideCoverage");
    }
}
