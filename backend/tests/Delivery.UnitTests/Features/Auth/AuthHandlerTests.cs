using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.GetCurrentUser;
using Delivery.Features.Auth.Login;
using Delivery.Features.Auth.RefreshToken;
using Delivery.Features.Auth.RevokeToken;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Xunit;

namespace Delivery.UnitTests.Features.Auth;

public class AuthHandlerTests
{
    private sealed class FakeTenantContext : ITenantContext
    {
        public Guid? TenantId { get; set; }
        public string? TenantSlug { get; set; }
        public bool IsResolved => TenantId.HasValue;
    }

    private static DbContextOptions<AppDbContext> CreateInMemoryOptions(string dbName)
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
    }

    private static JwtOptions CreateJwtOptions() => new()
    {
        SecretKey = "SuperSecureUnitTestingSecretKeyForHmacSha256AtLeast256BitsLong!",
        Issuer = "DeliveryPlatform.Api",
        Audience = "DeliveryPlatform.Clients",
        AccessTokenExpirationMinutes = 15,
        RefreshTokenExpirationDays = 7
    };

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnAccessTokenAndRefreshToken()
    {
        var dbName = Guid.NewGuid().ToString();
        var passwordHasher = new BCryptPasswordHasher();
        var tokenProvider = new JwtTokenProvider(Options.Create(CreateJwtOptions()));

        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var tenantContext = new FakeTenantContext();
        var handler = new LoginHandler(context, tenantContext, passwordHasher, tokenProvider);

        var command = new LoginCommand("esmeralda@lagranjita.com", "Admin123!", "la-granjita", "127.0.0.1");
        var result = await handler.Handle(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.Value.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.Value.User.Email.Should().Be("esmeralda@lagranjita.com");
        result.Value.User.Roles.Should().Contain("TenantAdmin");

        // Verify Refresh Token was persisted in DB
        var tokenHash = tokenProvider.HashToken(result.Value.RefreshToken);
        var storedToken = await context.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
        storedToken.Should().NotBeNull();
        storedToken!.RevokedAt.Should().BeNull();
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldReturnInvalidCredentialsError()
    {
        var dbName = Guid.NewGuid().ToString();
        var passwordHasher = new BCryptPasswordHasher();
        var tokenProvider = new JwtTokenProvider(Options.Create(CreateJwtOptions()));

        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var handler = new LoginHandler(context, new FakeTenantContext(), passwordHasher, tokenProvider);

        var command = new LoginCommand("esmeralda@lagranjita.com", "WrongPassword123!", "la-granjita");
        var result = await handler.Handle(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.InvalidCredentials");
    }

    [Fact]
    public async Task Login_WithInactiveUser_ShouldReturnUserInactiveError()
    {
        var dbName = Guid.NewGuid().ToString();
        var passwordHasher = new BCryptPasswordHasher();
        var tokenProvider = new JwtTokenProvider(Options.Create(CreateJwtOptions()));

        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
            var user = await seedCtx.Users.FirstAsync(u => u.Email == "cajero@lagranjita.com");
            user.IsActive = false;
            await seedCtx.SaveChangesAsync();
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var handler = new LoginHandler(context, new FakeTenantContext(), passwordHasher, tokenProvider);

        var command = new LoginCommand("cajero@lagranjita.com", "Admin123!", "la-granjita");
        var result = await handler.Handle(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.UserInactive");
    }

    [Fact]
    public async Task RefreshToken_WithValidToken_ShouldRotateTokensAndRevokeOldOne()
    {
        var dbName = Guid.NewGuid().ToString();
        var tokenProvider = new JwtTokenProvider(Options.Create(CreateJwtOptions()));
        var passwordHasher = new BCryptPasswordHasher();

        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var loginHandler = new LoginHandler(context, new FakeTenantContext(), passwordHasher, tokenProvider);
        var loginResult = await loginHandler.Handle(new LoginCommand("esmeralda@lagranjita.com", "Admin123!", "la-granjita"));

        var initialRefreshToken = loginResult.Value.RefreshToken;

        var refreshHandler = new RefreshTokenHandler(context, tokenProvider);
        var refreshResult = await refreshHandler.Handle(new RefreshTokenCommand(initialRefreshToken, "127.0.0.1"));

        refreshResult.IsSuccess.Should().BeTrue();
        refreshResult.Value.AccessToken.Should().NotBeNullOrWhiteSpace();
        refreshResult.Value.RefreshToken.Should().NotBe(initialRefreshToken);

        // Old token must be marked as revoked
        var oldHash = tokenProvider.HashToken(initialRefreshToken);
        var oldEntity = await context.RefreshTokens.FirstAsync(rt => rt.TokenHash == oldHash);
        oldEntity.RevokedAt.Should().NotBeNull();

        // Attempting to reuse old token must fail
        var reuseResult = await refreshHandler.Handle(new RefreshTokenCommand(initialRefreshToken, "127.0.0.1"));
        reuseResult.IsFailure.Should().BeTrue();
        reuseResult.Error.Code.Should().Be("Auth.InvalidRefreshToken");
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnProfileWithRolesAndBranch()
    {
        var dbName = Guid.NewGuid().ToString();

        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var cashier = await context.Users.FirstAsync(u => u.Email == "cajero@lagranjita.com");

        var handler = new GetCurrentUserHandler(context);
        var result = await handler.Handle(new GetCurrentUserQuery(cashier.Id));

        result.IsSuccess.Should().BeTrue();
        result.Value.Email.Should().Be("cajero@lagranjita.com");
        result.Value.Roles.Should().Contain("Cashier");
        result.Value.BranchId.Should().NotBeNull();
        result.Value.TenantSlug.Should().Be("la-granjita");
    }

    [Fact]
    public async Task RevokeToken_ShouldRevokeActiveRefreshToken()
    {
        var dbName = Guid.NewGuid().ToString();
        var tokenProvider = new JwtTokenProvider(Options.Create(CreateJwtOptions()));
        var passwordHasher = new BCryptPasswordHasher();

        await using (var seedCtx = new AppDbContext(CreateInMemoryOptions(dbName)))
        {
            await DatabaseSeeder.SeedAsync(seedCtx);
        }

        await using var context = new AppDbContext(CreateInMemoryOptions(dbName));
        var loginHandler = new LoginHandler(context, new FakeTenantContext(), passwordHasher, tokenProvider);
        var loginResult = await loginHandler.Handle(new LoginCommand("esmeralda@lagranjita.com", "Admin123!", "la-granjita"));

        var rawToken = loginResult.Value.RefreshToken;
        var logoutHandler = new RevokeTokenHandler(context, tokenProvider);

        var result = await logoutHandler.Handle(new RevokeTokenCommand(rawToken));
        result.IsSuccess.Should().BeTrue();

        var hash = tokenProvider.HashToken(rawToken);
        var entity = await context.RefreshTokens.FirstAsync(rt => rt.TokenHash == hash);
        entity.RevokedAt.Should().NotBeNull();
    }
}

