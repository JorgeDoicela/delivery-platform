using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.WebAuthn;
using Delivery.Features.Common.Security;
using Fido2NetLib;
using Fido2NetLib.Objects;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Auth;

public class WebAuthnTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"WebAuthnTestDb_{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public void RelyingPartyResolver_ShouldResolveLocalhost_WhenOriginIsLocal()
    {
        // Arrange
        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        var configuration = new ConfigurationBuilder().Build();
        var resolver = new WebAuthnRelyingPartyResolver(httpContextAccessor.Object, configuration);

        // Act
        var rpId = resolver.ResolveRpId(clientOrigin: "http://localhost:3005");

        // Assert
        rpId.Should().Be("localhost");
    }

    [Fact]
    public void RelyingPartyResolver_ShouldResolveCustomDomain_WhenTenantHasCustomDomain()
    {
        // Arrange
        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        var configuration = new ConfigurationBuilder().Build();
        var resolver = new WebAuthnRelyingPartyResolver(httpContextAccessor.Object, configuration);

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "La Granjita",
            Slug = "la-granjita",
            Settings = new TenantSetting { CustomDomain = "pedidos.lagranjita.com" }
        };

        // Act
        var rpId = resolver.ResolveRpId(tenant, clientOrigin: "https://pedidos.lagranjita.com");

        // Assert
        rpId.Should().Be("pedidos.lagranjita.com");
    }

    [Fact]
    public void RelyingPartyResolver_ShouldResolvePlatformDomain_WhenSubdomainMatches()
    {
        // Arrange
        var inMemoryConfig = new Dictionary<string, string?>
        {
            { "Multitenancy:PlatformDomain", "mesafy.doicela.dev" }
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemoryConfig)
            .Build();

        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        var resolver = new WebAuthnRelyingPartyResolver(httpContextAccessor.Object, configuration);

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "La Granjita",
            Slug = "la-granjita"
        };

        // Act
        var rpId = resolver.ResolveRpId(tenant, clientOrigin: "https://la-granjita.mesafy.doicela.dev");

        // Assert
        rpId.Should().Be("mesafy.doicela.dev");
    }

    [Fact]
    public async Task RegisterOptionsHandler_ShouldReturnOptions_WhenUserExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "chef@restaurante.com",
            FullName = "Chef Ejecutivo",
            PasswordHash = "hash",
            IsActive = true
        };
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var webAuthnProvider = new Mock<IWebAuthnProvider>();
        var dummyOptions = new CredentialCreateOptions
        {
            Rp = new PublicKeyCredentialRpEntity("localhost", "Test RP"),
            User = new Fido2User { Id = userId.ToByteArray(), Name = user.Email, DisplayName = user.FullName },
            Challenge = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 },
            PubKeyCredParams = new List<PubKeyCredParam>()
        };

        webAuthnProvider
            .Setup(p => p.GenerateRegistrationOptionsAsync(
                It.Is<User>(u => u.Id == userId),
                It.IsAny<Tenant?>(),
                It.IsAny<IEnumerable<byte[]>>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(dummyOptions);

        var handler = new RegisterOptionsHandler(context, webAuthnProvider.Object);
        var command = new RegisterOptionsCommand(userId, null, "http://localhost:3005");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Rp.Id.Should().Be("localhost");
        result.Value.User.Name.Should().Be("chef@restaurante.com");
    }

    [Fact]
    public async Task GetCredentialsHandler_ShouldReturnOnlyUserCredentials()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var user1Id = Guid.NewGuid();
        var user2Id = Guid.NewGuid();

        var cred1 = new WebAuthnCredential
        {
            Id = Guid.NewGuid(),
            UserId = user1Id,
            FriendlyName = "MacBook Pro Touch ID",
            CredentialId = new byte[] { 1, 2, 3 },
            PublicKey = new byte[] { 4, 5, 6 },
            AuthenticatorType = "platform",
            CreatedAt = DateTime.UtcNow
        };

        var cred2 = new WebAuthnCredential
        {
            Id = Guid.NewGuid(),
            UserId = user2Id,
            FriendlyName = "Windows Hello PC",
            CredentialId = new byte[] { 7, 8, 9 },
            PublicKey = new byte[] { 10, 11, 12 },
            AuthenticatorType = "platform",
            CreatedAt = DateTime.UtcNow
        };

        await context.WebAuthnCredentials.AddRangeAsync(cred1, cred2);
        await context.SaveChangesAsync();

        var handler = new GetCredentialsHandler(context);

        // Act
        var result = await handler.Handle(new GetCredentialsQuery(user1Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value[0].FriendlyName.Should().Be("MacBook Pro Touch ID");
    }

    [Fact]
    public async Task DeleteCredentialHandler_ShouldDeleteCredential_WhenOwnedByUser()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var credId = Guid.NewGuid();

        var cred = new WebAuthnCredential
        {
            Id = credId,
            UserId = userId,
            FriendlyName = "YubiKey 5C NFC",
            CredentialId = new byte[] { 10, 20, 30 },
            PublicKey = new byte[] { 40, 50, 60 },
            CreatedAt = DateTime.UtcNow
        };

        await context.WebAuthnCredentials.AddAsync(cred);
        await context.SaveChangesAsync();

        var handler = new DeleteCredentialHandler(context);

        // Act
        var result = await handler.Handle(new DeleteCredentialCommand(credId, userId), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var inDb = await context.WebAuthnCredentials.FindAsync(credId);
        inDb.Should().BeNull();
    }

    [Fact]
    public async Task DeleteCredentialHandler_ShouldFail_WhenCredentialBelongsToAnotherUser()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var credId = Guid.NewGuid();

        var cred = new WebAuthnCredential
        {
            Id = credId,
            UserId = ownerId,
            FriendlyName = "Llave segura",
            CredentialId = new byte[] { 1, 2 },
            PublicKey = new byte[] { 3, 4 },
            CreatedAt = DateTime.UtcNow
        };

        await context.WebAuthnCredentials.AddAsync(cred);
        await context.SaveChangesAsync();

        var handler = new DeleteCredentialHandler(context);

        // Act
        var result = await handler.Handle(new DeleteCredentialCommand(credId, otherUserId), CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.PasskeyNotFound");
    }

    [Fact]
    public async Task UpdateCredentialHandler_ShouldUpdateFriendlyName()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var credId = Guid.NewGuid();

        var cred = new WebAuthnCredential
        {
            Id = credId,
            UserId = userId,
            FriendlyName = "Viejo Nombre",
            CredentialId = new byte[] { 1, 2 },
            PublicKey = new byte[] { 3, 4 },
            CreatedAt = DateTime.UtcNow
        };

        await context.WebAuthnCredentials.AddAsync(cred);
        await context.SaveChangesAsync();

        var handler = new UpdateCredentialHandler(context);

        // Act
        var result = await handler.Handle(new UpdateCredentialCommand(credId, userId, "Nuevo iPhone 16 Pro"), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.FriendlyName.Should().Be("Nuevo iPhone 16 Pro");

        var inDb = await context.WebAuthnCredentials.FindAsync(credId);
        inDb!.FriendlyName.Should().Be("Nuevo iPhone 16 Pro");
    }
}
