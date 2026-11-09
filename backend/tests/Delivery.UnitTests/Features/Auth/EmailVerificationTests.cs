using System.Net;
using System.Security.Cryptography;
using System.Text;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Emails;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.Register;
using Delivery.Features.Auth.ResendVerification;
using Delivery.Features.Auth.VerifyEmail;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Auth;

public class EmailVerificationTests
{
    private sealed class FakeTenantContext : ITenantContext
    {
        public Guid? TenantId { get; set; }
        public string? TenantSlug { get; set; }
        public bool IsResolved => TenantId.HasValue;
    }

    private static DbContextOptions<AppDbContext> CreateOptions()
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task RegisterHandler_ShouldCreateEmailVerificationTokenAndEnqueueEmail_WhenUserRegisters()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed_pwd");

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<Role>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("access_token_123", DateTime.UtcNow.AddMinutes(15)));
        mockTokenProvider.Setup(t => t.GenerateRefreshToken())
            .Returns(("refresh_token_raw", "refresh_token_hash", DateTime.UtcNow.AddDays(7)));

        var mockEmailQueue = new Mock<IBackgroundEmailQueue>();

        var handler = new RegisterHandler(
            context,
            fakeTenantContext,
            mockHasher.Object,
            mockTokenProvider.Object,
            mockEmailQueue.Object);

        var command = new RegisterCommand(
            Email: "nuevo_cliente@granjita.com",
            Password: "Password123!",
            FullName: "Cliente Nuevo",
            Phone: "0991234567",
            TenantSlug: "la-granjita");

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.User.Email.Should().Be("nuevo_cliente@granjita.com");
        result.Value.User.IsEmailVerified.Should().BeFalse();

        // Verificar persistencia de token en BD
        var createdUser = await context.Users.FirstAsync(u => u.Email == "nuevo_cliente@granjita.com");
        createdUser.IsEmailVerified.Should().BeFalse();
        createdUser.EmailVerifiedAt.Should().BeNull();

        var tokenRecord = await context.EmailVerificationTokens
            .FirstOrDefaultAsync(t => t.UserId == createdUser.Id);

        tokenRecord.Should().NotBeNull();
        tokenRecord!.TokenHash.Should().NotBeNullOrWhiteSpace();
        tokenRecord.UsedAt.Should().BeNull();
        tokenRecord.ExpiresAt.Should().BeAfter(DateTime.UtcNow);

        // Verificar que se despachó el correo de verificación vía queue
        mockEmailQueue.Verify(q => q.EnqueueTemplatedEmail(
            "nuevo_cliente@granjita.com",
            "Cliente Nuevo",
            It.Is<string>(s => s.Contains("Verifica tu correo")),
            EmailTemplateType.EmailVerification,
            It.Is<EmailVerificationEmailModel>(m => m.UserName == "Cliente Nuevo" && m.VerificationToken.Length == 64),
            tenant.Id
        ), Times.Once);
    }

    [Fact]
    public async Task VerifyEmailHandler_WithValidToken_ShouldVerifyEmailAndMarkTokenUsed()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "verificar_me@granjita.com",
            PasswordHash = "hashed",
            FullName = "Usuario Por Verificar",
            IsActive = true,
            IsEmailVerified = false
        };
        await context.Users.AddAsync(user);

        var rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };
        await context.EmailVerificationTokens.AddAsync(verificationToken);
        await context.SaveChangesAsync();

        var handler = new VerifyEmailHandler(context);
        var request = new VerifyEmailRequest(rawToken, user.Email);

        // Act
        var result = await handler.Handle(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Success.Should().BeTrue();
        result.Value.Email.Should().Be(user.Email);

        var updatedUser = await context.Users.FindAsync(user.Id);
        updatedUser!.IsEmailVerified.Should().BeTrue();
        updatedUser.EmailVerifiedAt.Should().NotBeNull();

        var updatedToken = await context.EmailVerificationTokens.FindAsync(verificationToken.Id);
        updatedToken!.UsedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task VerifyEmailHandler_WithExpiredToken_ShouldReturnFailure()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "expirado@granjita.com",
            PasswordHash = "hashed",
            FullName = "Usuario Expirado",
            IsActive = true,
            IsEmailVerified = false
        };
        await context.Users.AddAsync(user);

        var rawToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        var expiredToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-10), // Ya expiró
            CreatedAt = DateTime.UtcNow.AddHours(-25)
        };
        await context.EmailVerificationTokens.AddAsync(expiredToken);
        await context.SaveChangesAsync();

        var handler = new VerifyEmailHandler(context);
        var request = new VerifyEmailRequest(rawToken, user.Email);

        // Act
        var result = await handler.Handle(request);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(AuthErrors.InvalidOrExpiredVerificationToken.Code);

        var unupdatedUser = await context.Users.FindAsync(user.Id);
        unupdatedUser!.IsEmailVerified.Should().BeFalse();
    }

    [Fact]
    public async Task VerifyEmailHandler_WithAlreadyUsedToken_ShouldReturnFailure()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "ya_usado@granjita.com",
            PasswordHash = "hashed",
            FullName = "Usuario Ya Usado",
            IsActive = true,
            IsEmailVerified = false
        };
        await context.Users.AddAsync(user);

        var rawToken = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        var usedToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            UsedAt = DateTime.UtcNow.AddMinutes(-2) // Ya usado
        };
        await context.EmailVerificationTokens.AddAsync(usedToken);
        await context.SaveChangesAsync();

        var handler = new VerifyEmailHandler(context);
        var request = new VerifyEmailRequest(rawToken, user.Email);

        // Act
        var result = await handler.Handle(request);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(AuthErrors.InvalidOrExpiredVerificationToken.Code);
    }

    [Fact]
    public async Task ResendVerificationHandler_ShouldInvalidateOldTokensAndSendNewEmail_WhenUserUnverified()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "reenvio@granjita.com",
            PasswordHash = "hashed",
            FullName = "Usuario Reenvio",
            IsActive = true,
            IsEmailVerified = false
        };
        await context.Users.AddAsync(user);

        var oldToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = "old_token_hash",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        await context.EmailVerificationTokens.AddAsync(oldToken);
        await context.SaveChangesAsync();

        var mockEmailQueue = new Mock<IBackgroundEmailQueue>();
        var handler = new ResendVerificationHandler(context, fakeTenantContext, mockEmailQueue.Object);

        var request = new ResendVerificationRequest("reenvio@granjita.com", "la-granjita");

        // Act
        var result = await handler.Handle(request);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var updatedOldToken = await context.EmailVerificationTokens.FindAsync(oldToken.Id);
        updatedOldToken!.UsedAt.Should().NotBeNull();

        var activeTokens = await context.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToListAsync();
        activeTokens.Should().HaveCount(1);

        mockEmailQueue.Verify(q => q.EnqueueTemplatedEmail(
            "reenvio@granjita.com",
            "Usuario Reenvio",
            It.Is<string>(s => s.Contains("Verifica tu correo")),
            EmailTemplateType.EmailVerification,
            It.IsAny<EmailVerificationEmailModel>(),
            tenant.Id
        ), Times.Once);
    }

    [Fact]
    public async Task ResendVerificationHandler_ShouldInformAlreadyVerified_WhenUserIsVerified()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "ya_verificado@granjita.com",
            PasswordHash = "hashed",
            FullName = "Usuario Verificado",
            IsActive = true,
            IsEmailVerified = true,
            EmailVerifiedAt = DateTime.UtcNow.AddDays(-1)
        };
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var mockEmailQueue = new Mock<IBackgroundEmailQueue>();
        var handler = new ResendVerificationHandler(context, fakeTenantContext, mockEmailQueue.Object);

        var request = new ResendVerificationRequest("ya_verificado@granjita.com", "la-granjita");

        // Act
        var result = await handler.Handle(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Message.Should().Contain("ya se encuentra verificado");
        mockEmailQueue.Verify(q => q.EnqueueTemplatedEmail(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<EmailTemplateType>(), It.IsAny<object>(), It.IsAny<Guid?>()
        ), Times.Never);
    }

    [Fact]
    public void HtmlEmailTemplateEngine_RenderEmailVerification_ShouldContainValidHtml()
    {
        var engine = new HtmlEmailTemplateEngine();
        var model = new EmailVerificationEmailModel
        {
            Brand = new BrandEmailContext
            {
                BrandName = "La Granjita Asadero",
                PrimaryColor = "#E4002B",
                SupportEmail = "soporte@granjita.com"
            },
            UserName = "Carlos Santana",
            UserEmail = "carlos@granjita.com",
            VerificationUrl = "https://mesafy.doicela.dev/la-granjita/login?tab=verify-email&token=abcdef123456&email=carlos@granjita.com",
            VerificationToken = "abcdef123456",
            ExpirationMinutes = 1440
        };

        var (html, text) = engine.Render(EmailTemplateType.EmailVerification, model);

        html.Should().NotBeNullOrWhiteSpace();
        WebUtility.HtmlDecode(html).Should().Contain("Carlos Santana");
        WebUtility.HtmlDecode(html).Should().Contain("La Granjita Asadero");
        WebUtility.HtmlDecode(html).Should().Contain("abcdef123456");
        WebUtility.HtmlDecode(html).Should().Contain("https://mesafy.doicela.dev/la-granjita/login?tab=verify-email&token=abcdef123456&email=carlos@granjita.com");

        text.Should().Contain("Carlos Santana");
        text.Should().Contain("abcdef123456");
        text.Should().Contain("https://mesafy.doicela.dev/la-granjita/login?tab=verify-email&token=abcdef123456&email=carlos@granjita.com");
    }
}
