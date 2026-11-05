using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Branches.UpdateBranchOperatingHours;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Xunit;

namespace Delivery.UnitTests.Features;

public class UpdateBranchOperatingHoursHandlerTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private static Branch CreateValidBranch(int id, string name)
    {
        var shell = new[]
        {
            new Coordinate(-78.50, -0.20),
            new Coordinate(-78.40, -0.20),
            new Coordinate(-78.40, -0.10),
            new Coordinate(-78.50, -0.10),
            new Coordinate(-78.50, -0.20)
        };

        return new Branch
        {
            Id = id,
            Name = name,
            Address = "Av. Maldonado y Clodoveo Carrión",
            Phone = "0987654321",
            OpeningTime = "10:30",
            ClosingTime = "21:30",
            LocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.45, -0.15)),
            CoveragePolygon = GeometryFactory.CreatePolygon(shell),
            MaxOrdersPerSlot = 15,
            IsActive = true
        };
    }

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenValidHoursProvided_ShouldUpdateBranchAndReturnSuccess()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateValidBranch(1, "Guamaní");
        context.Branches.Add(branch);
        await context.SaveChangesAsync();

        var validator = new UpdateBranchOperatingHoursValidator();
        var handler = new UpdateBranchOperatingHoursHandler(context, validator);

        var command = new UpdateBranchOperatingHoursCommand(
            BranchId: 1,
            OpeningTime: "09:00",
            ClosingTime: "22:00",
            IsActive: true
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.OpeningTime.Should().Be("09:00");
        result.Value.ClosingTime.Should().Be("22:00");
        result.Value.IsActive.Should().BeTrue();

        var persisted = await context.Branches.FindAsync(1);
        persisted!.OpeningTime.Should().Be("09:00");
        persisted.ClosingTime.Should().Be("22:00");
    }

    [Fact]
    public async Task Handle_WhenBranchNotFound_ShouldReturnBranchNotFoundError()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var validator = new UpdateBranchOperatingHoursValidator();
        var handler = new UpdateBranchOperatingHoursHandler(context, validator);

        var command = new UpdateBranchOperatingHoursCommand(
            BranchId: 999,
            OpeningTime: "10:00",
            ClosingTime: "20:00"
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Branches.NotFound");
    }

    [Theory]
    [InlineData("25:00", "22:00")]
    [InlineData("10:65", "22:00")]
    [InlineData("hora", "22:00")]
    [InlineData("10:00", "")]
    public async Task Handle_WhenInvalidTimeFormat_ShouldReturnValidationError(string opening, string closing)
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var validator = new UpdateBranchOperatingHoursValidator();
        var handler = new UpdateBranchOperatingHoursHandler(context, validator);

        var command = new UpdateBranchOperatingHoursCommand(
            BranchId: 1,
            OpeningTime: opening,
            ClosingTime: closing
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenClosingEqualsOpening_ShouldReturnValidationError()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var validator = new UpdateBranchOperatingHoursValidator();
        var handler = new UpdateBranchOperatingHoursHandler(context, validator);

        var command = new UpdateBranchOperatingHoursCommand(
            BranchId: 1,
            OpeningTime: "12:00",
            ClosingTime: "12:00"
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Message.Should().Contain("no puede ser idéntica");
    }
}

