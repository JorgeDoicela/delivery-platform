using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Orders.GetBranchCapacity;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using NetTopologySuite.Geometries;
using StackExchange.Redis;
using Xunit;

namespace Delivery.UnitTests.Features;

public class GetBranchCapacityHandlerTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private static Branch CreateValidBranch(int id, string name, int maxOrdersPerSlot = 15)
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
            Address = "Av. Principal 123",
            Phone = "0991112233",
            LocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.45, -0.15)),
            CoveragePolygon = GeometryFactory.CreatePolygon(shell),
            MaxOrdersPerSlot = maxOrdersPerSlot,
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
    public async Task Handle_WhenBranchNotFound_ShouldReturnFailure()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockRedis = new Mock<IConnectionMultiplexer>();
        var handler = new GetBranchCapacityHandler(context, mockRedis.Object);

        // Act
        var result = await handler.Handle(new GetBranchCapacityQuery(BranchId: 999));

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Branch.NotFound");
    }

    [Fact]
    public async Task Handle_StandardDemand_ShouldReturnNormalEstimatedTime()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateValidBranch(1, "Sucursal Norte", 15);
        context.Branches.Add(branch);
        await context.SaveChangesAsync();

        var mockDatabase = new Mock<IDatabase>();
        mockDatabase.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync((RedisValue)"8"); // 8 órdenes (por debajo de 15)

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);

        var handler = new GetBranchCapacityHandler(context, mockRedis.Object);

        // Act
        var result = await handler.Handle(new GetBranchCapacityQuery(branch.Id));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.CurrentSlotOrders.Should().Be(8);
        result.Value.IsHighDemand.Should().BeFalse();
        result.Value.IsSaturated.Should().BeFalse();
        result.Value.EstimatedDeliveryTime.Should().Be("35-45 min");
        result.Value.DemandNotice.Should().BeNull();
    }

    [Fact]
    public async Task Handle_HighDemand_ShouldReturnExtendedTimeAndNotice()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateValidBranch(2, "Sucursal Centro", 15);
        context.Branches.Add(branch);
        await context.SaveChangesAsync();

        var mockDatabase = new Mock<IDatabase>();
        mockDatabase.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync((RedisValue)"18"); // 18 órdenes (> 15 y <= 22)

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);

        var handler = new GetBranchCapacityHandler(context, mockRedis.Object);

        // Act
        var result = await handler.Handle(new GetBranchCapacityQuery(branch.Id));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.CurrentSlotOrders.Should().Be(18);
        result.Value.IsHighDemand.Should().BeTrue();
        result.Value.IsSaturated.Should().BeFalse();
        result.Value.EstimatedDeliveryTime.Should().Be("60-75 min");
        result.Value.DemandNotice.Should().Contain("extendido a 60-75 min");
    }

    [Fact]
    public async Task Handle_CriticalSaturation_ShouldReturnSaturatedAndPausedNotice()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateValidBranch(3, "Sucursal Sur", 15);
        context.Branches.Add(branch);
        await context.SaveChangesAsync();

        var mockDatabase = new Mock<IDatabase>();
        mockDatabase.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync((RedisValue)"25"); // 25 órdenes (> 22 = 1.5 * 15)

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);

        var handler = new GetBranchCapacityHandler(context, mockRedis.Object);

        // Act
        var result = await handler.Handle(new GetBranchCapacityQuery(branch.Id));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.CurrentSlotOrders.Should().Be(25);
        result.Value.IsHighDemand.Should().BeFalse();
        result.Value.IsSaturated.Should().BeTrue();
        result.Value.EstimatedDeliveryTime.Should().Contain("Pausado");
        result.Value.DemandNotice.Should().Contain("saturada temporalmente");
    }
}
