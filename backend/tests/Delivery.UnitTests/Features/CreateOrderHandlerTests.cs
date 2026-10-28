using Delivery.Core.Contracts;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Orders.CreateOrder;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using NetTopologySuite.Geometries;
using StackExchange.Redis;
using Xunit;

namespace Delivery.UnitTests.Features;

public class CreateOrderHandlerTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Branch CreateBranch(int id = 1, int maxOrdersPerSlot = 15)
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
            Name = "Sucursal Test",
            Address = "Av. Amazonas 100",
            Phone = "0991234567",
            LocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.45, -0.15)),
            CoveragePolygon = GeometryFactory.CreatePolygon(shell),
            MaxOrdersPerSlot = maxOrdersPerSlot,
            IsActive = true
        };
    }

    private static Product CreateProduct(int id = 1, decimal price = 5.00m)
    {
        return new Product
        {
            Id = id,
            Name = "1/4 Pollo Asado",
            BasePrice = price,
            IsActive = true,
            Category = "Combos"
        };
    }

    [Fact]
    public async Task Handle_WithValidOrder_ShouldCreateOrderAndNotifyKitchen()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateBranch();
        var product = CreateProduct();
        context.Branches.Add(branch);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var mockDatabase = new Mock<IDatabase>();
        mockDatabase.Setup(d => d.StringIncrementAsync(It.IsAny<RedisKey>(), It.IsAny<long>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(5); // 5 órdenes <= 22 hardCap

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);

        var mockKitchenNotifier = new Mock<IKitchenNotifier>();

        var handler = new CreateOrderHandler(
            context,
            new CreateOrderValidator(),
            mockRedis.Object,
            mockKitchenNotifier.Object
        );

        var command = new CreateOrderCommand(
            BranchId: branch.Id,
            CustomerName: "Juan Pérez",
            CustomerPhone: "0998765432",
            CustomerEmail: "juan@test.com",
            IdentificationType: "CEDULA",
            IdentificationNumber: "1712345678",
            AddressStreet: "Av. 10 de Agosto",
            AddressReference: "Cerca del banco",
            DeliveryLatitude: -0.1800,
            DeliveryLongitude: -78.4800,
            PaymentMethod: PaymentMethod.CashOnDelivery,
            DeliveryType: DeliveryType.Delivery,
            CashAmountPaid: 20.00m,
            TransferReceiptUrl: null,
            Items: [new CreateOrderItemRequest(product.Id, 2, null)]
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Total.Should().Be(11.50m); // 2 * 5.00 + 1.50 delivery fee
        result.Value.ChangeDue.Should().Be(8.50m);

        mockKitchenNotifier.Verify(k => k.NotifyNewOrderAsync(
            branch.Id,
            It.Is<KitchenOrderTicketDto>(t => t.OrderId == result.Value.OrderId),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenSlotExceeded_ShouldCompensateAndReturnSlotCapacityExceeded()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateBranch(1, maxOrdersPerSlot: 10);
        var product = CreateProduct();
        context.Branches.Add(branch);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var mockDatabase = new Mock<IDatabase>();
        // HardCap = 10 * 1.5 = 15. Incrementar a 16 excede el hardCap
        mockDatabase.Setup(d => d.StringIncrementAsync(It.IsAny<RedisKey>(), It.IsAny<long>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(16);

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);

        var mockKitchenNotifier = new Mock<IKitchenNotifier>();

        var handler = new CreateOrderHandler(
            context,
            new CreateOrderValidator(),
            mockRedis.Object,
            mockKitchenNotifier.Object
        );

        var command = new CreateOrderCommand(
            BranchId: branch.Id,
            CustomerName: "Juan Pérez",
            CustomerPhone: "0998765432",
            CustomerEmail: "juan@test.com",
            IdentificationType: "CEDULA",
            IdentificationNumber: "1712345678",
            AddressStreet: "Av. 10 de Agosto",
            AddressReference: "Cerca del banco",
            DeliveryLatitude: -0.1800,
            DeliveryLongitude: -78.4800,
            PaymentMethod: PaymentMethod.CashOnDelivery,
            DeliveryType: DeliveryType.Delivery,
            CashAmountPaid: 20.00m,
            TransferReceiptUrl: null,
            Items: [new CreateOrderItemRequest(product.Id, 1, null)]
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(CreateOrderErrors.SlotCapacityExceeded.Code);

        // Verifica que se decrementó el contador en Redis como compensación
        mockDatabase.Verify(d => d.StringDecrementAsync(It.IsAny<RedisKey>(), It.IsAny<long>(), It.IsAny<CommandFlags>()), Times.Once);
        mockKitchenNotifier.Verify(k => k.NotifyNewOrderAsync(It.IsAny<int>(), It.IsAny<KitchenOrderTicketDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}

