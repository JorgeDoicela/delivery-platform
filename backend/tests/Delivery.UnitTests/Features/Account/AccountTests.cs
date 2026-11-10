using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Account.ChangePassword;
using Delivery.Features.Account.DeleteAddress;
using Delivery.Features.Account.GetAccountProfile;
using Delivery.Features.Account.GetMyAddresses;
using Delivery.Features.Account.GetMyOrders;
using Delivery.Features.Account.UpdateAccountProfile;
using Delivery.Features.Account.UpsertAddress;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Privacy;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using Xunit;

namespace Delivery.UnitTests.Features.Account;

public class AccountTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAccountProfile_UserNotFound_ShouldReturnFailure()
    {
        using var context = CreateInMemoryDbContext();
        var mockConsent = new Mock<ICustomerConsentTracker>();
        var handler = new GetAccountProfileHandler(context, mockConsent.Object);

        var result = await handler.Handle(new GetAccountProfileQuery(Guid.NewGuid()));

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(AccountErrors.UserNotFound.Code);
    }

    [Fact]
    public async Task GetAccountProfile_ValidUser_ShouldReturnProfileWithStats()
    {
        using var context = CreateInMemoryDbContext();
        var mockConsent = new Mock<ICustomerConsentTracker>();
        mockConsent.Setup(c => c.HasConsentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "carlos@example.com",
            FullName = "Carlos Mendoza",
            Phone = "+593987654321",
            IsActive = true,
            IsEmailVerified = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var handler = new GetAccountProfileHandler(context, mockConsent.Object);
        var result = await handler.Handle(new GetAccountProfileQuery(user.Id));

        result.IsSuccess.Should().BeTrue();
        result.Value.Email.Should().Be("carlos@example.com");
        result.Value.FullName.Should().Be("Carlos Mendoza");
        result.Value.Phone.Should().Be("+593987654321");
        result.Value.IsEmailVerified.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAccountProfile_ValidData_ShouldUpdateUserAndCustomer()
    {
        using var context = CreateInMemoryDbContext();
        var mockConsent = new Mock<ICustomerConsentTracker>();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "carlos@example.com",
            FullName = "Carlos",
            Phone = "+593987654321",
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var validator = new UpdateAccountProfileValidator();
        var handler = new UpdateAccountProfileHandler(context, validator, mockConsent.Object);

        var command = new UpdateAccountProfileCommand(
            user.Id,
            "Carlos Mendoza Real",
            "+593999999999",
            "CEDULA",
            "1712345678"
        );

        var result = await handler.Handle(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.FullName.Should().Be("Carlos Mendoza Real");
        result.Value.Phone.Should().Be("+593999999999");
        result.Value.IdentificationType.Should().Be("CEDULA");
        result.Value.IdentificationNumber.Should().Be("1712345678");

        var updatedInDb = await context.Users.FindAsync(user.Id);
        updatedInDb!.FullName.Should().Be("Carlos Mendoza Real");
    }

    [Fact]
    public async Task ChangePassword_WrongCurrentPassword_ShouldReturnFailure()
    {
        using var context = CreateInMemoryDbContext();
        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Verify("wrong_pass", "hashed_secret")).Returns(false);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "carlos@example.com",
            PasswordHash = "hashed_secret",
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var validator = new ChangePasswordValidator();
        var handler = new ChangePasswordHandler(context, validator, mockHasher.Object);

        var command = new ChangePasswordCommand(user.Id, "wrong_pass", "NewSecret123", "NewSecret123");
        var result = await handler.Handle(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(AccountErrors.InvalidCurrentPassword.Code);
    }

    [Fact]
    public async Task ChangePassword_CorrectPassword_ShouldUpdateHashAndRevokeRefreshTokens()
    {
        using var context = CreateInMemoryDbContext();
        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Verify("old_secret", "hashed_old")).Returns(true);
        mockHasher.Setup(h => h.Hash("new_secret_123")).Returns("hashed_new");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "carlos@example.com",
            PasswordHash = "hashed_old",
            IsActive = true
        };
        context.Users.Add(user);

        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = "token_hash_1",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        context.RefreshTokens.Add(token);
        await context.SaveChangesAsync();

        var validator = new ChangePasswordValidator();
        var handler = new ChangePasswordHandler(context, validator, mockHasher.Object);

        var command = new ChangePasswordCommand(user.Id, "old_secret", "new_secret_123", "new_secret_123");
        var result = await handler.Handle(command);

        result.IsSuccess.Should().BeTrue();

        var updatedUser = await context.Users.FindAsync(user.Id);
        updatedUser!.PasswordHash.Should().Be("hashed_new");

        var updatedToken = await context.RefreshTokens.FindAsync(token.Id);
        updatedToken!.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task AddressCrud_ShouldAllowCreateUpdateDelete()
    {
        using var context = CreateInMemoryDbContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "carlos@example.com",
            FullName = "Carlos",
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var upsertValidator = new UpsertAddressValidator();
        var upsertHandler = new UpsertAddressHandler(context, upsertValidator);
        var getAddressesHandler = new GetMyAddressesHandler(context);
        var deleteHandler = new DeleteAddressHandler(context);

        // 1. Crear Dirección 1 (Casa)
        var createCmd1 = new UpsertAddressCommand(
            user.Id,
            null,
            "Casa",
            "Av. 10 de Agosto y Colón",
            "Frente al parque",
            "Quito",
            -0.1806,
            -78.4678,
            true
        );
        var res1 = await upsertHandler.Handle(createCmd1);
        res1.IsSuccess.Should().BeTrue();
        res1.Value.IsDefault.Should().BeTrue();

        // 2. Crear Dirección 2 (Oficina) como default
        var createCmd2 = new UpsertAddressCommand(
            user.Id,
            null,
            "Oficina",
            "Av. República del Salvador",
            "Edificio Platinum piso 4",
            "Quito",
            -0.1750,
            -78.4800,
            true
        );
        var res2 = await upsertHandler.Handle(createCmd2);
        res2.IsSuccess.Should().BeTrue();

        // 3. Listar direcciones: Oficina debe ser default, Casa ya no
        var listRes = await getAddressesHandler.Handle(new GetMyAddressesQuery(user.Id));
        listRes.IsSuccess.Should().BeTrue();
        listRes.Value.Should().HaveCount(2);
        listRes.Value[0].Title.Should().Be("Oficina");
        listRes.Value[0].IsDefault.Should().BeTrue();
        listRes.Value[1].Title.Should().Be("Casa");
        listRes.Value[1].IsDefault.Should().BeFalse();

        // 4. Eliminar Dirección 2
        var deleteRes = await deleteHandler.Handle(new DeleteAddressCommand(user.Id, res2.Value.Id));
        deleteRes.IsSuccess.Should().BeTrue();

        var remaining = await getAddressesHandler.Handle(new GetMyAddressesQuery(user.Id));
        remaining.Value.Should().HaveCount(1);
        remaining.Value[0].Title.Should().Be("Casa");
        remaining.Value[0].IsDefault.Should().BeTrue(); // Promovida a default
    }

    [Fact]
    public async Task GetMyOrders_ShouldReturnOrdersForAuthenticatedUser()
    {
        using var context = CreateInMemoryDbContext();
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "La Granjita", Slug = "la-granjita" };
        var gf = NtsGeometryServices.Instance.CreateGeometryFactory(4326);
        var branch = new Branch
        {
            Id = 1,
            TenantId = tenant.Id,
            Name = "Matriz Norte",
            SriEstablishmentCode = "001",
            SriEmissionPoint = "001",
            OpeningTime = "08:00",
            ClosingTime = "22:00",
            LocationPoint = gf.CreatePoint(new Coordinate(-78.48, -0.18)),
            CoveragePolygon = gf.CreatePolygon([
                new Coordinate(-78.50, -0.20),
                new Coordinate(-78.46, -0.20),
                new Coordinate(-78.46, -0.16),
                new Coordinate(-78.50, -0.16),
                new Coordinate(-78.50, -0.20)
            ])
        };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "carlos@example.com",
            FullName = "Carlos",
            IsActive = true
        };
        var product = new Product { Id = 10, TenantId = tenant.Id, Name = "Pollo Asado", BasePrice = 12.00m, Sku = "SKU1" };

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Tenant = tenant,
            BranchId = branch.Id,
            Branch = branch,
            OrderNumber = 1001,
            CustomerEmail = "carlos@example.com",
            CustomerName = "Carlos",
            CustomerPhone = "0999999999",
            Status = OrderStatus.Confirmed,
            Total = 15.00m,
            Subtotal = 12.00m,
            DeliveryFee = 3.00m,
            AddressStreet = "Av. América",
            CreatedAt = DateTime.UtcNow
        };
        order.Items.Add(new OrderItem
        {
            OrderId = order.Id,
            ProductId = product.Id,
            Product = product,
            ProductNameSnapshot = "Pollo Asado",
            UnitPriceSnapshot = 12.00m,
            Quantity = 1
        });

        context.Tenants.Add(tenant);
        context.Branches.Add(branch);
        context.Users.Add(user);
        context.Products.Add(product);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new GetMyOrdersHandler(context);
        var result = await handler.Handle(new GetMyOrdersQuery(user.Id));

        result.IsSuccess.Should().BeTrue();
        result.Value.Orders.Should().HaveCount(1);
        result.Value.Orders[0].OrderNumber.Should().Be(1001);
        result.Value.Orders[0].BranchId.Should().Be(branch.Id);
        result.Value.Orders[0].StatusText.Should().Be("Confirmada");
        result.Value.Orders[0].IsActive.Should().BeTrue();
        result.Value.Orders[0].Items.Should().HaveCount(1);
        result.Value.Orders[0].Items[0].ProductName.Should().Be("Pollo Asado");
    }
}
