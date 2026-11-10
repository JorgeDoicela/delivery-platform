using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Orders.GetOrderById;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Xunit;

namespace Delivery.UnitTests.Features;

public class GetOrderByIdHandlerTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Tenant CreateTenant() => new()
    {
        Id = Guid.NewGuid(),
        Name = "La Granjita Test",
        Slug = "la-granjita",
        IsActive = true
    };

    private static Branch CreateBranch(Tenant tenant, int id = 1)
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
            TenantId = tenant.Id,
            Tenant = tenant,
            Name = "Sucursal Test",
            Address = "Av. Amazonas 100",
            Phone = "0991234567",
            LocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.45, -0.15)),
            CoveragePolygon = GeometryFactory.CreatePolygon(shell),
            IsActive = true
        };
    }

    private static Order CreateValidOrder(Branch branch, Tenant tenant, User? owner = null)
    {
        return new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Tenant = tenant,
            BranchId = branch.Id,
            Branch = branch,
            OrderNumber = 1001,
            CustomerName = owner?.FullName ?? "Carlos Cliente",
            CustomerPhone = owner?.Phone ?? "0987654321",
            CustomerEmail = owner?.Email ?? "carlos@test.com",
            CreatedByUserId = owner?.Id ?? Guid.NewGuid(),
            AddressStreet = "Av. Amazonas 123",
            IdentificationType = "CEDULA",
            IdentificationNumber = "1712345678",
            Subtotal = 20.00m,
            DeliveryFee = 1.50m,
            Total = 21.50m
        };
    }

    [Fact]
    public async Task Handle_WhenOrderNotFound_ShouldReturnOrderNotFound()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new GetOrderByIdHandler(context, new GetOrderByIdValidator());
        var query = new GetOrderByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(GetOrderByIdErrors.OrderNotFound.Code);
    }

    [Fact]
    public async Task Handle_WhenCustomerUnauthenticated_ShouldReturnAuthenticationRequired()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenant = CreateTenant();
        var branch = CreateBranch(tenant, 1);
        var order = CreateValidOrder(branch, tenant);

        context.Tenants.Add(tenant);
        context.Branches.Add(branch);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new GetOrderByIdHandler(context, new GetOrderByIdValidator());
        var query = new GetOrderByIdQuery(order.Id, RequesterUserId: null, RequesterRoles: []);

        // Act
        var result = await handler.Handle(query);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(GetOrderByIdErrors.AuthenticationRequired.Code);
    }

    [Fact]
    public async Task Handle_WhenCustomerIsDifferentUser_ShouldReturnForbidden()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenant = CreateTenant();
        var branch = CreateBranch(tenant, 1);
        var ownerUser = new User { Id = Guid.NewGuid(), Email = "owner@test.com", FullName = "Owner User", IsActive = true };
        var otherUser = new User { Id = Guid.NewGuid(), Email = "other@test.com", FullName = "Other User", IsActive = true };
        var order = CreateValidOrder(branch, tenant, ownerUser);

        context.Tenants.Add(tenant);
        context.Users.AddRange(ownerUser, otherUser);
        context.Branches.Add(branch);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new GetOrderByIdHandler(context, new GetOrderByIdValidator());
        var query = new GetOrderByIdQuery(order.Id, RequesterUserId: otherUser.Id, RequesterRoles: ["Customer"]);

        // Act
        var result = await handler.Handle(query);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(GetOrderByIdErrors.Forbidden.Code);
    }

    [Fact]
    public async Task Handle_WhenCustomerIsOwner_ShouldReturnOrderDetails()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenant = CreateTenant();
        var branch = CreateBranch(tenant, 1);
        var ownerUser = new User { Id = Guid.NewGuid(), Email = "owner@test.com", FullName = "Owner User", IsActive = true };
        var order = CreateValidOrder(branch, tenant, ownerUser);

        context.Tenants.Add(tenant);
        context.Users.Add(ownerUser);
        context.Branches.Add(branch);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new GetOrderByIdHandler(context, new GetOrderByIdValidator());
        var query = new GetOrderByIdQuery(order.Id, RequesterUserId: ownerUser.Id, RequesterRoles: ["Customer"]);

        // Act
        var result = await handler.Handle(query);

        // Assert
        result.IsSuccess.Should().BeTrue(result.IsFailure ? $"{result.Error.Code}: {result.Error.Message}" : "");
        result.Value.OrderId.Should().Be(order.Id);
        result.Value.OrderNumber.Should().Be(1001);
        result.Value.CustomerEmail.Should().Be("owner@test.com");
    }

    [Fact]
    public async Task Handle_WhenStaffRequestsOrder_ShouldReturnOrderDetailsEvenIfNotOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var tenant = CreateTenant();
        var branch = CreateBranch(tenant, 1);
        var order = CreateValidOrder(branch, tenant);

        context.Tenants.Add(tenant);
        context.Branches.Add(branch);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new GetOrderByIdHandler(context, new GetOrderByIdValidator());
        var query = new GetOrderByIdQuery(order.Id, RequesterUserId: Guid.NewGuid(), RequesterRoles: ["Kitchen"]);

        // Act
        var result = await handler.Handle(query);

        // Assert
        result.IsSuccess.Should().BeTrue(result.IsFailure ? $"{result.Error.Code}: {result.Error.Message}" : "");
        result.Value.OrderId.Should().Be(order.Id);
        result.Value.OrderNumber.Should().Be(1001);
    }
}
