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
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "juan@test.com",
            FullName = "Juan Pérez",
            Phone = "0998765432",
            IsActive = true
        };
        context.Branches.Add(branch);
        context.Products.Add(product);
        context.Users.Add(user);
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
            Items: [new CreateOrderItemRequest(product.Id, 2, null)],
            UserId: user.Id
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Total.Should().Be(11.50m); // 2 * 5.00 + 1.50 delivery fee
        result.Value.ChangeDue.Should().Be(8.50m);

        var savedOrder = await context.Orders.FirstOrDefaultAsync(o => o.Id == result.Value.OrderId);
        savedOrder.Should().NotBeNull();
        savedOrder!.CreatedByUserId.Should().Be(user.Id);
        savedOrder.CustomerEmail.Should().Be(user.Email);
        savedOrder.CustomerId.Should().NotBeNull();

        mockKitchenNotifier.Verify(k => k.NotifyNewOrderAsync(
            branch.Id,
            It.Is<KitchenOrderTicketDto>(t => t.OrderId == result.Value.OrderId),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    [Fact]
    public async Task Handle_WithoutUserId_ShouldFailValidation()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateBranch();
        var product = CreateProduct();
        context.Branches.Add(branch);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var mockRedis = new Mock<IConnectionMultiplexer>();
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
            Items: [new CreateOrderItemRequest(product.Id, 2, null)],
            UserId: null
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ShouldReturnUserNotFound()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateBranch();
        var product = CreateProduct();
        context.Branches.Add(branch);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var mockRedis = new Mock<IConnectionMultiplexer>();
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
            Items: [new CreateOrderItemRequest(product.Id, 2, null)],
            UserId: Guid.NewGuid()
        );

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(CreateOrderErrors.UserNotFound.Code);
    }

    [Fact]
    public async Task Handle_WhenSlotExceeded_ShouldCompensateAndReturnSlotCapacityExceeded()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var branch = CreateBranch(1, maxOrdersPerSlot: 10);
        var product = CreateProduct();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "juan@test.com",
            FullName = "Juan Pérez",
            Phone = "0998765432",
            IsActive = true
        };
        context.Branches.Add(branch);
        context.Products.Add(product);
        context.Users.Add(user);
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
            Items: [new CreateOrderItemRequest(product.Id, 1, null)],
            UserId: user.Id
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

    [Fact]
    public async Task Handle_WhenBranchProductHasCustomPrice_ShouldApplyBranchPriceTaxSnapshotAndSequentialOrderNumber()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var branch = CreateBranch(10, maxOrdersPerSlot: 15);
        branch.TenantId = tenantId;

        var product = CreateProduct(100, price: 20.50m);
        product.TenantId = tenantId;
        product.TaxRate = 15.00m;

        var branchProduct = new BranchProduct
        {
            TenantId = tenantId,
            BranchId = branch.Id,
            ProductId = product.Id,
            IsAvailable = true,
            CustomPrice = 23.00m
        };

        var settings = new TenantSetting
        {
            TenantId = tenantId,
            BaseDeliveryFee = 2.00m
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "cliente@tenant.com",
            FullName = "Cliente Sucursal",
            Phone = "0991112233",
            IsActive = true
        };

        context.Branches.Add(branch);
        context.Products.Add(product);
        context.BranchProducts.Add(branchProduct);
        context.TenantSettings.Add(settings);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockDatabase = new Mock<IDatabase>();
        mockDatabase.Setup(d => d.StringIncrementAsync(It.IsAny<RedisKey>(), It.IsAny<long>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(1);
        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(mockDatabase.Object);

        var handler = new CreateOrderHandler(
            context,
            new CreateOrderValidator(),
            mockRedis.Object,
            new Mock<IKitchenNotifier>().Object);

        var command = new CreateOrderCommand(
            BranchId: branch.Id,
            CustomerName: "Cliente Sucursal",
            CustomerPhone: "0991112233",
            CustomerEmail: "cliente@tenant.com",
            IdentificationType: "CEDULA",
            IdentificationNumber: "1712345678",
            AddressStreet: "Av. Principal 123",
            AddressReference: "Frente al parque",
            DeliveryLatitude: -0.15,
            DeliveryLongitude: -78.45,
            PaymentMethod: PaymentMethod.CashOnDelivery,
            DeliveryType: DeliveryType.Delivery,
            CashAmountPaid: 50.00m,
            TransferReceiptUrl: null,
            Items: [new CreateOrderItemRequest(product.Id, 2, null)],
            UserId: user.Id);

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var savedOrder = await context.Orders.Include(o => o.Items).FirstAsync(o => o.Id == result.Value.OrderId);
        savedOrder.TenantId.Should().Be(tenantId);
        savedOrder.BranchId.Should().Be(branch.Id);
        savedOrder.OrderNumber.Should().Be(1001);
        savedOrder.Subtotal.Should().Be(46.00m); // 2 x 23.00 (CustomPrice de la sucursal)
        savedOrder.DeliveryFee.Should().Be(2.00m);
        savedOrder.Total.Should().Be(48.00m);
        savedOrder.TaxAmount.Should().Be(6.00m); // 46.00 - (46.00 / 1.15 = 40.00) = 6.00
        savedOrder.Items.Single().UnitPriceSnapshot.Should().Be(23.00m);
        savedOrder.Items.Single().TaxRateSnapshot.Should().Be(15.00m);
    }

    [Fact]
    public async Task Handle_WhenBranchProductIsUnavailable_ShouldReturnProductUnavailable()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var branch = CreateBranch(11);
        branch.TenantId = tenantId;
        var product = CreateProduct(101, price: 10.00m);
        product.TenantId = tenantId;
        context.Branches.Add(branch);
        context.Products.Add(product);
        context.BranchProducts.Add(new BranchProduct
        {
            TenantId = tenantId,
            BranchId = branch.Id,
            ProductId = product.Id,
            IsAvailable = false
        });
        var user = new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "a@b.com", FullName = "A", Phone = "0990000001", IsActive = true };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var handler = new CreateOrderHandler(
            context,
            new CreateOrderValidator(),
            new Mock<IConnectionMultiplexer>().Object,
            new Mock<IKitchenNotifier>().Object);

        var command = new CreateOrderCommand(
            BranchId: branch.Id,
            CustomerName: "A",
            CustomerPhone: "0990000001",
            CustomerEmail: "a@b.com",
            IdentificationType: "CONSUMIDOR_FINAL",
            IdentificationNumber: "9999999999999",
            AddressStreet: "Calle 1",
            AddressReference: "",
            DeliveryLatitude: null,
            DeliveryLongitude: null,
            PaymentMethod: PaymentMethod.CashOnDelivery,
            DeliveryType: DeliveryType.Takeout,
            CashAmountPaid: null,
            TransferReceiptUrl: null,
            Items: [new CreateOrderItemRequest(product.Id, 1, null)],
            UserId: user.Id);

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(CreateOrderErrors.ProductUnavailable.Code);
    }

    [Fact]
    public async Task Handle_WhenProductBelongsToAnotherTenant_ShouldReturnProductUnavailable()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var branchA = CreateBranch(12);
        branchA.TenantId = tenantA;
        var productB = CreateProduct(102, price: 10.00m);
        productB.TenantId = tenantB;
        var user = new User { Id = Guid.NewGuid(), TenantId = tenantA, Email = "c@d.com", FullName = "C", Phone = "0990000002", IsActive = true };
        context.Branches.Add(branchA);
        context.Products.Add(productB);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var handler = new CreateOrderHandler(
            context,
            new CreateOrderValidator(),
            new Mock<IConnectionMultiplexer>().Object,
            new Mock<IKitchenNotifier>().Object);

        var command = new CreateOrderCommand(
            BranchId: branchA.Id,
            CustomerName: "C",
            CustomerPhone: "0990000002",
            CustomerEmail: "c@d.com",
            IdentificationType: "CONSUMIDOR_FINAL",
            IdentificationNumber: "9999999999999",
            AddressStreet: "Calle 2",
            AddressReference: "",
            DeliveryLatitude: null,
            DeliveryLongitude: null,
            PaymentMethod: PaymentMethod.CashOnDelivery,
            DeliveryType: DeliveryType.Takeout,
            CashAmountPaid: null,
            TransferReceiptUrl: null,
            Items: [new CreateOrderItemRequest(productB.Id, 1, null)],
            UserId: user.Id);

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(CreateOrderErrors.ProductUnavailable.Code);
    }

    [Fact]
    public async Task Handle_WhenBranchHasBaseDeliveryFeeOverride_ShouldUseBranchDeliveryFeeOverTenantSetting()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var branch = CreateBranch(13);
        branch.TenantId = tenantId;
        branch.BaseDeliveryFeeOverride = 3.25m;

        var product = CreateProduct(103, price: 10.00m);
        product.TenantId = tenantId;

        context.Branches.Add(branch);
        context.Products.Add(product);
        context.TenantSettings.Add(new TenantSetting { TenantId = tenantId, BaseDeliveryFee = 1.50m });
        var user = new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "fee@test.com", FullName = "Fee Test", Phone = "0990000003", IsActive = true };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockDatabase = new Mock<IDatabase>();
        mockDatabase.Setup(d => d.StringIncrementAsync(It.IsAny<RedisKey>(), It.IsAny<long>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(1);
        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(mockDatabase.Object);

        var handler = new CreateOrderHandler(
            context,
            new CreateOrderValidator(),
            mockRedis.Object,
            new Mock<IKitchenNotifier>().Object);

        var command = new CreateOrderCommand(
            BranchId: branch.Id,
            CustomerName: "Fee Test",
            CustomerPhone: "0990000003",
            CustomerEmail: "fee@test.com",
            IdentificationType: "CONSUMIDOR_FINAL",
            IdentificationNumber: "9999999999999",
            AddressStreet: "Calle 3",
            AddressReference: "",
            DeliveryLatitude: -0.15,
            DeliveryLongitude: -78.45,
            PaymentMethod: PaymentMethod.CashOnDelivery,
            DeliveryType: DeliveryType.Delivery,
            CashAmountPaid: 20.00m,
            TransferReceiptUrl: null,
            Items: [new CreateOrderItemRequest(product.Id, 1, null)],
            UserId: user.Id);

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var savedOrder = await context.Orders.FirstAsync(o => o.Id == result.Value.OrderId);
        savedOrder.DeliveryFee.Should().Be(3.25m);
        savedOrder.Total.Should().Be(13.25m);
    }
}

