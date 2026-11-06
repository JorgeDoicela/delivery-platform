using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Drivers.ClaimDriverOrder;
using Delivery.Features.Drivers.GetDriverOrders;
using Delivery.Features.Drivers.GetDriverProfile;
using Delivery.Features.Drivers.UpdateDriverStatus;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Drivers;

public class DriverHandlerTests
{
    private static DbContextOptions<AppDbContext> CreateInMemoryOptions(string dbName)
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
    }

    private static (Mock<ITrackingNotifier> TrackingMock, Mock<IKitchenNotifier> KitchenMock) CreateNotifiers()
    {
        var tracking = new Mock<ITrackingNotifier>();
        var kitchen = new Mock<IKitchenNotifier>();
        return (tracking, kitchen);
    }

    [Fact]
    public async Task GetDriverProfile_WithValidDriverUser_ShouldReturnProfileAndMetrics()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));

        // Obtener el repartidor sembrado
        var driver = await context.Drivers.Include(d => d.User).FirstAsync();
        var handler = new GetDriverProfileHandler(context);

        var result = await handler.Handle(new GetDriverProfileQuery(driver.UserId));

        result.IsSuccess.Should().BeTrue();
        result.Value.DriverId.Should().Be(driver.Id);
        result.Value.UserId.Should().Be(driver.UserId);
        result.Value.VehicleType.Should().Be("MOTO");
        result.Value.LicensePlate.Should().Be("PBA-4521");
        result.Value.IsAvailable.Should().BeTrue();
    }

    [Fact]
    public async Task GetDriverProfile_WithNonDriverUser_ShouldReturnNotFound()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var handler = new GetDriverProfileHandler(context);

        var result = await handler.Handle(new GetDriverProfileQuery(Guid.NewGuid()));

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Drivers.NotFound");
    }

    [Fact]
    public async Task UpdateDriverStatus_ShouldToggleAvailabilityAndVehicleData()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var driver = await context.Drivers.FirstAsync();

        var validator = new UpdateDriverStatusValidator();
        var updateHandler = new UpdateDriverStatusHandler(context, validator);

        var command = new UpdateDriverStatusCommand(
            UserId: driver.UserId,
            IsAvailable: false,
            VehicleType: "SCOOTER",
            LicensePlate: "XYZ-9999"
        );

        var result = await updateHandler.Handle(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.IsAvailable.Should().BeFalse();
        result.Value.VehicleType.Should().Be("SCOOTER");
        result.Value.LicensePlate.Should().Be("XYZ-9999");

        // Verificar persistencia en base de datos
        var updated = await context.Drivers.FindAsync(driver.Id);
        updated!.IsAvailable.Should().BeFalse();
        updated.VehicleType.Should().Be("SCOOTER");
        updated.LicensePlate.Should().Be("XYZ-9999");
    }

    [Fact]
    public async Task GetDriverOrders_ShouldClassifyActiveAvailableAndDeliveredOrders()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var driver = await context.Drivers.FirstAsync();
        var branch = await context.Branches.FirstAsync();

        // 1. Crear comanda lista para delivery (Available)
        var availableOrder = new Order
        {
            TenantId = driver.TenantId,
            BranchId = branch.Id,
            OrderNumber = 5001,
            CustomerName = "Cliente Disponible",
            CustomerPhone = "0999999991",
            AddressStreet = "Av. Amazonas 123",
            DeliveryType = DeliveryType.Delivery,
            Status = OrderStatus.ReadyForDelivery,
            PaymentMethod = PaymentMethod.CashOnDelivery,
            Total = 25.50m,
            DeliveryFee = 2.00m
        };
        await context.Orders.AddAsync(availableOrder);

        // 2. Crear comanda en camino con este motorizado (Active)
        var activeOrder = new Order
        {
            TenantId = driver.TenantId,
            BranchId = branch.Id,
            OrderNumber = 5002,
            CustomerName = "Cliente En Camino",
            CustomerPhone = "0999999992",
            AddressStreet = "Av. Shyris 456",
            DeliveryType = DeliveryType.Delivery,
            Status = OrderStatus.OnTheWay,
            PaymentMethod = PaymentMethod.CreditDebitCard,
            Total = 30.00m,
            DeliveryFee = 2.50m
        };
        await context.Orders.AddAsync(activeOrder);
        await context.OrderDeliveries.AddAsync(new OrderDelivery
        {
            OrderId = activeOrder.Id,
            DriverId = driver.Id,
            AssignedAt = DateTime.UtcNow
        });

        // 3. Crear comanda entregada hoy (DeliveredToday)
        var deliveredOrder = new Order
        {
            TenantId = driver.TenantId,
            BranchId = branch.Id,
            OrderNumber = 5003,
            CustomerName = "Cliente Entregado",
            CustomerPhone = "0999999993",
            AddressStreet = "Av. República 789",
            DeliveryType = DeliveryType.Delivery,
            Status = OrderStatus.Delivered,
            PaymentMethod = PaymentMethod.CashOnDelivery,
            Total = 20.00m,
            DeliveryFee = 1.50m,
            UpdatedAt = DateTime.UtcNow
        };
        await context.Orders.AddAsync(deliveredOrder);
        await context.OrderDeliveries.AddAsync(new OrderDelivery
        {
            OrderId = deliveredOrder.Id,
            DriverId = driver.Id,
            AssignedAt = DateTime.UtcNow.AddHours(-1),
            DeliveredAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        var handler = new GetDriverOrdersHandler(context);
        var result = await handler.Handle(new GetDriverOrdersQuery(driver.UserId, branch.Id));

        result.IsSuccess.Should().BeTrue();
        result.Value.ActiveOrders.Should().ContainSingle(o => o.OrderId == activeOrder.Id);
        result.Value.AvailableOrders.Should().ContainSingle(o => o.OrderId == availableOrder.Id);
        result.Value.DeliveredToday.Should().ContainSingle(o => o.OrderId == deliveredOrder.Id);

        // Resumen financiero de turno
        result.Value.ShiftSummary.CompletedCount.Should().Be(1);
        result.Value.ShiftSummary.CashCollected.Should().Be(20.00m); // Solo el en efectivo entregado hoy
        result.Value.ShiftSummary.TotalEarnings.Should().Be(1.50m);
    }

    [Fact]
    public async Task ClaimDriverOrder_WhenOrderIsReady_ShouldAssignDriverAndSetOnTheWay()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var driver = await context.Drivers.FirstAsync();
        var branch = await context.Branches.FirstAsync();

        var order = new Order
        {
            TenantId = driver.TenantId,
            BranchId = branch.Id,
            OrderNumber = 7001,
            CustomerName = "Carlos Cliente",
            CustomerPhone = "0981112233",
            AddressStreet = "Calle Las Acacias N12",
            DeliveryType = DeliveryType.Delivery,
            Status = OrderStatus.ReadyForDelivery,
            PaymentMethod = PaymentMethod.CashOnDelivery,
            Total = 18.00m
        };
        await context.Orders.AddAsync(order);
        await context.SaveChangesAsync();

        var (trackingMock, kitchenMock) = CreateNotifiers();
        var validator = new ClaimDriverOrderValidator();
        var handler = new ClaimDriverOrderHandler(context, validator, trackingMock.Object, kitchenMock.Object);

        var result = await handler.Handle(new ClaimDriverOrderCommand(order.Id, driver.UserId));

        result.IsSuccess.Should().BeTrue();
        result.Value.OrderId.Should().Be(order.Id);
        result.Value.Status.Should().Be(OrderStatus.OnTheWay);
        result.Value.AssignedAt.Should().NotBe(default);
        result.Value.PickedUpAt.Should().NotBe(default);

        // Verificar persistencia y vínculo en OrderDeliveries
        var delivery = await context.OrderDeliveries.FirstOrDefaultAsync(od => od.OrderId == order.Id);
        delivery.Should().NotBeNull();
        delivery!.DriverId.Should().Be(driver.Id);

        // Verificar actualización en Order
        var updatedOrder = await context.Orders.FindAsync(order.Id);
        updatedOrder!.Status.Should().Be(OrderStatus.OnTheWay);

        // Verificar emisión de notificaciones en tiempo real
        trackingMock.Verify(t => t.NotifyOrderStatusChangedAsync(order.Id, OrderStatus.OnTheWay, It.IsAny<CancellationToken>()), Times.Once);
        kitchenMock.Verify(k => k.NotifyOrderStatusChangedAsync(order.Id, OrderStatus.OnTheWay, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ClaimDriverOrder_WhenNotDeliveryType_ShouldReturnError()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var driver = await context.Drivers.FirstAsync();
        var branch = await context.Branches.FirstAsync();

        var order = new Order
        {
            TenantId = driver.TenantId,
            BranchId = branch.Id,
            OrderNumber = 7002,
            CustomerName = "Cliente Takeout",
            DeliveryType = DeliveryType.Takeout, // Retiro en local
            Status = OrderStatus.ReadyForDelivery,
            Total = 12.00m
        };
        await context.Orders.AddAsync(order);
        await context.SaveChangesAsync();

        var (trackingMock, kitchenMock) = CreateNotifiers();
        var validator = new ClaimDriverOrderValidator();
        var handler = new ClaimDriverOrderHandler(context, validator, trackingMock.Object, kitchenMock.Object);

        var result = await handler.Handle(new ClaimDriverOrderCommand(order.Id, driver.UserId));

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Drivers.NotADeliveryOrder");
    }

    [Fact]
    public async Task ClaimDriverOrder_WhenAlreadyClaimedByAnotherDriver_ShouldReturnError()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var driver1 = await context.Drivers.FirstAsync();
        var branch = await context.Branches.FirstAsync();

        // Crear un segundo motorizado
        var user2 = new User
        {
            TenantId = driver1.TenantId,
            Email = "repartidor2@test.com",
            FullName = "Segundo Motorizado",
            Phone = "0988888888"
        };
        await context.Users.AddAsync(user2);
        var driver2 = new Driver
        {
            TenantId = driver1.TenantId,
            UserId = user2.Id,
            VehicleType = "MOTO",
            LicensePlate = "XYZ-1234",
            IsAvailable = true
        };
        await context.Drivers.AddAsync(driver2);

        var order = new Order
        {
            TenantId = driver1.TenantId,
            BranchId = branch.Id,
            OrderNumber = 7003,
            CustomerName = "Cliente Ocupado",
            DeliveryType = DeliveryType.Delivery,
            Status = OrderStatus.OnTheWay, // Ya en camino
            Total = 15.00m
        };
        await context.Orders.AddAsync(order);
        await context.OrderDeliveries.AddAsync(new OrderDelivery
        {
            OrderId = order.Id,
            DriverId = driver1.Id,
            AssignedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var (trackingMock, kitchenMock) = CreateNotifiers();
        var validator = new ClaimDriverOrderValidator();
        var handler = new ClaimDriverOrderHandler(context, validator, trackingMock.Object, kitchenMock.Object);

        // Driver2 intenta tomar la orden que ya lleva Driver1
        var result = await handler.Handle(new ClaimDriverOrderCommand(order.Id, driver2.UserId));

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Drivers.InvalidStatusForClaim");
    }
}

