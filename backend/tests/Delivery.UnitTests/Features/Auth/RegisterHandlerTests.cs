using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.Register;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Auth;

public class RegisterHandlerTests
{
    private sealed class FakeTenantContext : ITenantContext
    {
        public Guid? TenantId { get; set; }
        public string? TenantSlug { get; set; }
        public bool IsResolved => TenantId.HasValue;
    }

    private static DbContextOptions<AppDbContext> CreateOptions(string dbName)
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
    }

    [Fact]
    public async Task RegisterHandler_ShouldCreateUserAndCustomer_AndReturnValidTokens()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed_password_123");

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<Role>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("access_token_abc", DateTime.UtcNow.AddHours(1)));
        mockTokenProvider.Setup(t => t.GenerateRefreshToken())
            .Returns(("raw_refresh_token", "hash_refresh_token", DateTime.UtcNow.AddDays(7)));

        var handler = new RegisterHandler(context, fakeTenantContext, mockHasher.Object, mockTokenProvider.Object);

        var command = new RegisterCommand(
            Email: "maria.lopez@example.com",
            Password: "Password123!",
            FullName: "Maria Lopez",
            Phone: "0998877665",
            TenantSlug: "la-granjita",
            IdentificationType: "CEDULA",
            IdentificationNumber: "1712345678");

        var result = await handler.Handle(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("access_token_abc");
        result.Value.User.Email.Should().Be("maria.lopez@example.com");
        result.Value.User.FullName.Should().Be("Maria Lopez");
        result.Value.User.Role.Should().Be("Customer");

        // Verificar persistencia en base de datos
        var savedUser = await context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email == "maria.lopez@example.com");

        savedUser.Should().NotBeNull();
        savedUser!.UserRoles.Should().ContainSingle(ur => ur.RoleId == Role.Customer);

        var savedCustomer = await context.Customers
            .FirstOrDefaultAsync(c => c.Phone == "0998877665");

        savedCustomer.Should().NotBeNull();
        savedCustomer!.IdentificationNumber.Should().Be("1712345678");
    }

    [Fact]
    public async Task RegisterHandler_ShouldSucceed_WithOnlyEmailAndPassword()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed_password_123");

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<Role>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("access_token_abc", DateTime.UtcNow.AddHours(1)));
        mockTokenProvider.Setup(t => t.GenerateRefreshToken())
            .Returns(("raw_refresh_token", "hash_refresh_token", DateTime.UtcNow.AddDays(7)));

        var handler = new RegisterHandler(context, fakeTenantContext, mockHasher.Object, mockTokenProvider.Object);

        var command = new RegisterCommand(
            Email: "solo.correo@example.com",
            Password: "Password123!");

        var result = await handler.Handle(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.User.Email.Should().Be("solo.correo@example.com");
        result.Value.User.FullName.Should().Be("solo.correo");

        var savedUser = await context.Users
            .FirstOrDefaultAsync(u => u.Email == "solo.correo@example.com");

        savedUser.Should().NotBeNull();
        savedUser!.Phone.Should().BeEmpty();
    }

    [Fact]
    public async Task RegisterHandler_ShouldFail_WhenEmailAlreadyRegistered()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var mockHasher = new Mock<IPasswordHasher>();
        var mockTokenProvider = new Mock<ITokenProvider>();

        var handler = new RegisterHandler(context, fakeTenantContext, mockHasher.Object, mockTokenProvider.Object);

        // Intentar registrar el email de un usuario ya existente en el seeder (jorge@admin.com)
        var command = new RegisterCommand(
            Email: "jorge@admin.com",
            Password: "Password123!",
            FullName: "Admin Duplicado",
            Phone: "0999999999",
            TenantSlug: "la-granjita");

        var result = await handler.Handle(command);

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Auth.EmailAlreadyRegistered");
    }
}
