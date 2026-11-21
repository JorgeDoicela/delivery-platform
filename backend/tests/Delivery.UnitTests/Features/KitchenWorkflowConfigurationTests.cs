using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Domain.Policies;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Branches.UpdateBranchOperatingHours;
using Delivery.Features.Orders.UpdateOrderStatus;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using NetTopologySuite.Geometries;
using Xunit;

namespace Delivery.UnitTests.Features;

public class KitchenWorkflowConfigurationTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static UpdateOrderStatusHandler CreateOrderStatusHandler(AppDbContext context)
    {
        return new UpdateOrderStatusHandler(
            context,
            new UpdateOrderStatusValidator(),
            new Mock<ITrackingNotifier>().Object,
            new Mock<IKitchenNotifier>().Object
        );
    }

    private static Branch CreateBranch(Guid tenantId, int id, bool? kitchenOverride = null, bool? directTakeoutOverride = null)
    {
        var poly = GeometryFactory.CreatePolygon(new[]
        {
            new Coordinate(-78.5, -0.2),
            new Coordinate(-78.4, -0.2),
            new Coordinate(-78.4, -0.1),
            new Coordinate(-78.5, -0.1),
            new Coordinate(-78.5, -0.2)
        });

        return new Branch
        {
            Id = id,
            TenantId = tenantId,
            Name = $"Sucursal #{id}",
            Address = "Av. Principal",
            Phone = "0999999999",
            LocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.45, -0.15)),
            CoveragePolygon = poly,
            EnableKitchenWorkflowOverride = kitchenOverride,
            AllowDirectCounterTakeoutDeliveryOverride = directTakeoutOverride
        };
    }

    [Theory]
    [InlineData(true, null, true)]
    [InlineData(false, null, false)]
    [InlineData(true, false, false)]
    [InlineData(false, true, true)]
    public void KitchenWorkflowPolicy_ResolveKitchenWorkflow_ShouldApplyOverridePrecedence(
        bool tenantDefault,
        bool? branchOverride,
        bool expected)
    {
        var actual = KitchenWorkflowPolicy.ResolveKitchenWorkflow(tenantDefault, branchOverride);
        actual.Should().Be(expected);
    }

    [Fact]
    public async Task UpdateOrderStatus_WhenKitchenEnabled_ShouldRejectDirectConfirmedToReady()
    {
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        context.TenantSettings.Add(new TenantSetting
        {
            TenantId = tenantId,
            EnableKitchenWorkflow = true
        });
        context.Branches.Add(CreateBranch(tenantId, 10, kitchenOverride: null));
        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            BranchId = 10,
            CustomerName = "Cliente KDS",
            Status = OrderStatus.Confirmed,
            DeliveryType = DeliveryType.Delivery
        };
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = CreateOrderStatusHandler(context);
        var result = await handler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.ReadyForDelivery));

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(UpdateOrderStatusErrors.InvalidTransition.Code);
    }

    [Fact]
    public async Task UpdateOrderStatus_WhenCounterOnlyMode_ShouldAllowConfirmedToReadyForDelivery_AndRejectInKitchen()
    {
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        context.TenantSettings.Add(new TenantSetting
        {
            TenantId = tenantId,
            EnableKitchenWorkflow = false
        });
        context.Branches.Add(CreateBranch(tenantId, 20, kitchenOverride: null));
        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            BranchId = 20,
            CustomerName = "Cliente Mostrador",
            Status = OrderStatus.Confirmed,
            DeliveryType = DeliveryType.Delivery
        };
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = CreateOrderStatusHandler(context);

        var inKitchenResult = await handler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.InKitchen));
        inKitchenResult.IsFailure.Should().BeTrue();
        inKitchenResult.Error.Code.Should().Be(UpdateOrderStatusErrors.InvalidTransition.Code);

        var readyResult = await handler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.ReadyForDelivery));
        readyResult.IsSuccess.Should().BeTrue();
        readyResult.Value.CurrentStatus.Should().Be(OrderStatus.ReadyForDelivery);
    }

    [Fact]
    public async Task UpdateOrderStatus_WhenCounterOnlyModeAndTakeout_ShouldRespectAllowDirectCounterTakeoutDelivery()
    {
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        context.TenantSettings.Add(new TenantSetting
        {
            TenantId = tenantId,
            EnableKitchenWorkflow = false,
            AllowDirectCounterTakeoutDelivery = true
        });
        context.Branches.Add(CreateBranch(tenantId, 30, kitchenOverride: null, directTakeoutOverride: true));
        context.Branches.Add(CreateBranch(tenantId, 31, kitchenOverride: null, directTakeoutOverride: false));

        var directOrder = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            BranchId = 30,
            CustomerName = "Retiro Directo",
            Status = OrderStatus.Confirmed,
            DeliveryType = DeliveryType.Takeout
        };
        var twoStepOrder = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            BranchId = 31,
            CustomerName = "Retiro Dos Pasos",
            Status = OrderStatus.Confirmed,
            DeliveryType = DeliveryType.Takeout
        };
        context.Orders.AddRange(directOrder, twoStepOrder);
        await context.SaveChangesAsync();

        var handler = CreateOrderStatusHandler(context);

        var directResult = await handler.Handle(new UpdateOrderStatusCommand(directOrder.Id, OrderStatus.Delivered));
        directResult.IsSuccess.Should().BeTrue();
        directResult.Value.CurrentStatus.Should().Be(OrderStatus.Delivered);

        var blockedDirectResult = await handler.Handle(new UpdateOrderStatusCommand(twoStepOrder.Id, OrderStatus.Delivered));
        blockedDirectResult.IsFailure.Should().BeTrue();
        blockedDirectResult.Error.Code.Should().Be(UpdateOrderStatusErrors.InvalidTransition.Code);
    }

    [Fact]
    public async Task UpdateOrderStatus_WhenBranchOverridesTenant_ShouldUseBranchEffectiveMode()
    {
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        context.TenantSettings.Add(new TenantSetting
        {
            TenantId = tenantId,
            EnableKitchenWorkflow = true
        });
        // Sucursal express sobrescribe a Solo Mostrador aunque el tenant use Cocina
        context.Branches.Add(CreateBranch(tenantId, 40, kitchenOverride: false));
        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            BranchId = 40,
            CustomerName = "Cliente Express",
            Status = OrderStatus.Confirmed,
            DeliveryType = DeliveryType.Delivery
        };
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = CreateOrderStatusHandler(context);
        var result = await handler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.ReadyForDelivery));

        result.IsSuccess.Should().BeTrue();
        result.Value.CurrentStatus.Should().Be(OrderStatus.ReadyForDelivery);
    }

    [Fact]
    public async Task UpdateBranchOperatingHours_WhenApplyWorkflowOverridesTrue_ShouldUpdateAndResetToInherit()
    {
        using var context = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        context.TenantSettings.Add(new TenantSetting
        {
            TenantId = tenantId,
            EnableKitchenWorkflow = true,
            AllowDirectCounterTakeoutDelivery = false
        });
        context.Branches.Add(CreateBranch(tenantId, 50, kitchenOverride: null, directTakeoutOverride: null));
        await context.SaveChangesAsync();

        var handler = new UpdateBranchOperatingHoursHandler(context, new UpdateBranchOperatingHoursValidator());

        // 1. Forzar Solo Mostrador y entrega directa en la sucursal
        var setResult = await handler.Handle(new UpdateBranchOperatingHoursCommand(
            50, "09:00", "22:00", true, 15, true,
            EnableKitchenWorkflowOverride: false,
            AllowDirectCounterTakeoutDeliveryOverride: true,
            ApplyWorkflowOverrides: true));

        setResult.IsSuccess.Should().BeTrue();
        setResult.Value.EnableKitchenWorkflowOverride.Should().BeFalse();
        setResult.Value.UseKitchenWorkflow.Should().BeFalse();
        setResult.Value.AllowDirectCounterTakeoutDeliveryOverride.Should().BeTrue();
        setResult.Value.AllowDirectCounterTakeoutDelivery.Should().BeTrue();

        // 2. Restablecer a heredar de la marca (null)
        var resetResult = await handler.Handle(new UpdateBranchOperatingHoursCommand(
            50, "09:00", "22:00", true, 15, true,
            EnableKitchenWorkflowOverride: null,
            AllowDirectCounterTakeoutDeliveryOverride: null,
            ApplyWorkflowOverrides: true));

        resetResult.IsSuccess.Should().BeTrue();
        resetResult.Value.EnableKitchenWorkflowOverride.Should().BeNull();
        resetResult.Value.UseKitchenWorkflow.Should().BeTrue();
        resetResult.Value.AllowDirectCounterTakeoutDeliveryOverride.Should().BeNull();
        resetResult.Value.AllowDirectCounterTakeoutDelivery.Should().BeFalse();
    }
}
