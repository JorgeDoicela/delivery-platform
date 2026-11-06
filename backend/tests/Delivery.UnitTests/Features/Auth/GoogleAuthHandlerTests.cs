using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.GoogleAuth;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Auth;

public class GoogleAuthHandlerTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        DatabaseSeeder.SeedAsync(context).GetAwaiter().GetResult();
        return context;
    }

    [Fact]
    public async Task GoogleAuthHandler_ShouldRegisterNewCustomer_WhenValidGoogleTokenAndUserDoesNotExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockTenantContext = new Mock<ITenantContext>();
        mockTenantContext.Setup(t => t.TenantId).Returns((Guid?)null);

        var mockTokenValidator = new Mock<IGoogleTokenValidator>();
        mockTokenValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new GoogleTokenPayload(
                "sub-123456",
                "nuevo.google.cliente@gmail.com",
                "Cliente Google Prueba",
                "https://lh3.googleusercontent.com/photo.jpg",
                true)));

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider
            .Setup(tp => tp.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<Role>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("mock.google.jwt.token", DateTime.UtcNow.AddMinutes(15)));

        mockTokenProvider
            .Setup(tp => tp.GenerateRefreshToken())
            .Returns(("raw.mock.refresh.token", "hash.mock.refresh.token", DateTime.UtcNow.AddDays(7)));

        var handler = new GoogleAuthHandler(context, mockTenantContext.Object, mockTokenValidator.Object, mockTokenProvider.Object);
        var command = new GoogleAuthCommand("valid-google-id-token", "la-granjita");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.AccessToken.Should().Be("mock.google.jwt.token");
        result.Value.User.Email.Should().Be("nuevo.google.cliente@gmail.com");
        result.Value.User.FullName.Should().Be("Cliente Google Prueba");
        result.Value.User.Role.Should().Be("Customer");

        // Verificar que el usuario y el cliente fueron persistidos en base de datos
        var persistedUser = await context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == "nuevo.google.cliente@gmail.com");
        persistedUser.Should().NotBeNull();
        persistedUser!.FullName.Should().Be("Cliente Google Prueba");

        var persistedCustomer = await context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Email == "nuevo.google.cliente@gmail.com");
        persistedCustomer.Should().NotBeNull();
    }

    [Fact]
    public async Task GoogleAuthHandler_ShouldAuthenticateExistingUser_WhenValidGoogleTokenAndUserExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockTenantContext = new Mock<ITenantContext>();
        mockTenantContext.Setup(t => t.TenantId).Returns((Guid?)null);

        // jorge@admin.com ya está sembrado en DatabaseSeeder
        var mockTokenValidator = new Mock<IGoogleTokenValidator>();
        mockTokenValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new GoogleTokenPayload(
                "sub-admin-999",
                "jorge@admin.com",
                "Jorge SuperAdmin",
                null,
                true)));

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider
            .Setup(tp => tp.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<Role>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("mock.admin.google.jwt", DateTime.UtcNow.AddMinutes(15)));

        mockTokenProvider
            .Setup(tp => tp.GenerateRefreshToken())
            .Returns(("raw.mock.refresh.token", "hash.mock.refresh.token", DateTime.UtcNow.AddDays(7)));

        var handler = new GoogleAuthHandler(context, mockTenantContext.Object, mockTokenValidator.Object, mockTokenProvider.Object);
        var command = new GoogleAuthCommand("valid-token-for-admin");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("mock.admin.google.jwt");
        result.Value.User.Email.Should().Be("jorge@admin.com");
        result.Value.User.Role.Should().Be("SuperAdmin");
    }

    [Fact]
    public async Task GoogleAuthHandler_ShouldFail_WhenGoogleTokenValidatorFails()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockTenantContext = new Mock<ITenantContext>();
        var mockTokenValidator = new Mock<IGoogleTokenValidator>();
        mockTokenValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<GoogleTokenPayload>(AuthErrors.InvalidGoogleToken));

        var mockTokenProvider = new Mock<ITokenProvider>();

        var handler = new GoogleAuthHandler(context, mockTenantContext.Object, mockTokenValidator.Object, mockTokenProvider.Object);
        var command = new GoogleAuthCommand("invalid-or-expired-token");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be(AuthErrors.InvalidGoogleToken.Code);
    }
}
