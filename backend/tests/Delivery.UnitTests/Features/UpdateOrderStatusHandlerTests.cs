using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Orders.UpdateOrderStatus;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features;

public class UpdateOrderStatusHandlerTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static UpdateOrderStatusHandler CreateHandler(AppDbContext context)
    {
        var mockTrackingNotifier = new Mock<ITrackingNotifier>();
        var mockKitchenNotifier = new Mock<IKitchenNotifier>();
        return new UpdateOrderStatusHandler(
            context,
            new UpdateOrderStatusValidator(),
            mockTrackingNotifier.Object,
            mockKitchenNotifier.Object
        );
    }

    [Fact]
    public async Task Handle_WhenOrderDoesNotExist_ShouldReturnOrderNotFoundError()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = CreateHandler(context);
        var command = new UpdateOrderStatusCommand(Guid.NewGuid(), OrderStatus.Confirmed);

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(UpdateOrderStatusErrors.OrderNotFound.Code);
    }

    [Theory]
    [InlineData(OrderStatus.Created, OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Created, OrderStatus.PendingValidation)]
    [InlineData(OrderStatus.Created, OrderStatus.Cancelled)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.InKitchen)]
    [InlineData(OrderStatus.InKitchen, OrderStatus.ReadyForDelivery)]
    [InlineData(OrderStatus.ReadyForDelivery, OrderStatus.OnTheWay)]
    [InlineData(OrderStatus.OnTheWay, OrderStatus.Delivered)]
    public async Task Handle_ValidTransitions_ShouldUpdateStatusSuccessfully(OrderStatus initialStatus, OrderStatus targetStatus)
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerName = "Prueba Estado",
            Status = initialStatus
        };
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = CreateHandler(context);
        var command = new UpdateOrderStatusCommand(order.Id, targetStatus);

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.PreviousStatus.Should().Be(initialStatus);
        result.Value.CurrentStatus.Should().Be(targetStatus);

        var updatedOrder = await context.Orders.FindAsync(order.Id);
        updatedOrder!.Status.Should().Be(targetStatus);
        updatedOrder.UpdatedAt.Should().NotBeNull();
    }

    [Theory]
    [InlineData(OrderStatus.Delivered, OrderStatus.InKitchen)]
    [InlineData(OrderStatus.Delivered, OrderStatus.Created)]
    [InlineData(OrderStatus.ReadyForDelivery, OrderStatus.Created)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.InKitchen)]
    public async Task Handle_InvalidTransitions_ShouldReturnInvalidTransitionError(OrderStatus initialStatus, OrderStatus targetStatus)
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerName = "Prueba Transicion Invalida",
            Status = initialStatus
        };
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = CreateHandler(context);
        var command = new UpdateOrderStatusCommand(order.Id, targetStatus);

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(UpdateOrderStatusErrors.InvalidTransition.Code);

        var unaffectedOrder = await context.Orders.FindAsync(order.Id);
        unaffectedOrder!.Status.Should().Be(initialStatus);
    }
}
