using System.Net;
using System.Security.Cryptography;
using System.Text;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Emails;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.ForgotPassword;
using Delivery.Features.Auth.ResetPassword;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Auth;

public class PasswordResetTests
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
    public async Task ForgotPasswordHandler_ShouldGenerateTokenAndQueueEmail_WhenUserExists()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var mockEmailQueue = new Mock<IBackgroundEmailQueue>();
        var handler = new ForgotPasswordHandler(context, fakeTenantContext, mockEmailQueue.Object);

        // jorge@admin.com existe en el seeder
        var request = new ForgotPasswordRequest("jorge@admin.com", "la-granjita");

        var result = await handler.Handle(request);

        result.IsSuccess.Should().BeTrue();
        result.Value.Message.Should().Contain("Si el correo electrónico se encuentra registrado");

        // Verificar que el token se haya persistido en base de datos
        var user = await context.Users.FirstAsync(u => u.Email == "jorge@admin.com");
        var savedToken = await context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.UserId == user.Id && t.UsedAt == null);

        savedToken.Should().NotBeNull();
        savedToken!.IsActive.Should().BeTrue();
        savedToken.ExpiresAt.Should().BeAfter(DateTime.UtcNow);

        // Verificar que se haya encolado el correo de recuperación
        mockEmailQueue.Verify(
            q => q.EnqueueTemplatedEmail(
                "jorge@admin.com",
                It.IsAny<string?>(),
                It.Is<string>(s => s.Contains("Restablece tu contraseña")),
                EmailTemplateType.PasswordReset,
                It.IsAny<PasswordResetEmailModel>(),
                tenant.Id
            ),
            Times.Once
        );
    }

    [Fact]
    public async Task ForgotPasswordHandler_ShouldReturnGenericSuccessWithoutQueueingEmail_WhenUserDoesNotExist()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var tenant = await context.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var fakeTenantContext = new FakeTenantContext
        {
            TenantId = tenant.Id,
            TenantSlug = tenant.Slug
        };

        var mockEmailQueue = new Mock<IBackgroundEmailQueue>();
        var handler = new ForgotPasswordHandler(context, fakeTenantContext, mockEmailQueue.Object);

        var request = new ForgotPasswordRequest("no-existe@correo.com", "la-granjita");

        var result = await handler.Handle(request);

        result.IsSuccess.Should().BeTrue();
        result.Value.Message.Should().Contain("Si el correo electrónico se encuentra registrado");

        // No debe haberse encolado ningún correo ni creado ningún token
        mockEmailQueue.Verify(
            q => q.EnqueueTemplatedEmail(
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<EmailTemplateType>(),
                It.IsAny<object>(),
                It.IsAny<Guid?>()
            ),
            Times.Never
        );
    }

    [Fact]
    public async Task ResetPasswordHandler_ShouldUpdatePasswordHashAndRevokeRefreshTokens_WhenTokenIsValid()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var user = await context.Users.FirstAsync(u => u.Email == "jorge@admin.com");

        var rawToken = "my_secret_token_1234567890_abcdef";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        var resetToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            CreatedAt = DateTime.UtcNow
        };
        await context.PasswordResetTokens.AddAsync(resetToken);

        // Agregar un refresh token activo para verificar su revocación
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = "refresh_hash_abc",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = "127.0.0.1"
        };
        await context.RefreshTokens.AddAsync(refreshToken);
        await context.SaveChangesAsync();

        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Hash("NuevaClaveSegura2026!"))
            .Returns("bcrypt_hash_nueva_clave");

        var handler = new ResetPasswordHandler(context, mockHasher.Object);
        var request = new ResetPasswordRequest("jorge@admin.com", rawToken, "NuevaClaveSegura2026!");

        var result = await handler.Handle(request);

        result.IsSuccess.Should().BeTrue();
        result.Value.Success.Should().BeTrue();

        // Verificar que la contraseña del usuario se actualizó
        var updatedUser = await context.Users.FirstAsync(u => u.Id == user.Id);
        updatedUser.PasswordHash.Should().Be("bcrypt_hash_nueva_clave");

        // Verificar que el token quedó marcado como consumido
        var updatedToken = await context.PasswordResetTokens.FirstAsync(t => t.Id == resetToken.Id);
        updatedToken.UsedAt.Should().NotBeNull();
        updatedToken.IsActive.Should().BeFalse();

        // Verificar que los refresh tokens se revocaron
        var updatedRefreshToken = await context.RefreshTokens.FirstAsync(r => r.Id == refreshToken.Id);
        updatedRefreshToken.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ResetPasswordHandler_ShouldFail_WhenTokenIsExpired()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var user = await context.Users.FirstAsync(u => u.Email == "jorge@admin.com");

        var rawToken = "expired_token_12345";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        var resetToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5), // Expirado hace 5 min
            CreatedAt = DateTime.UtcNow.AddMinutes(-35)
        };
        await context.PasswordResetTokens.AddAsync(resetToken);
        await context.SaveChangesAsync();

        var mockHasher = new Mock<IPasswordHasher>();
        var handler = new ResetPasswordHandler(context, mockHasher.Object);

        var request = new ResetPasswordRequest("jorge@admin.com", rawToken, "NuevaClaveSegura2026!");
        var result = await handler.Handle(request);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(AuthErrors.InvalidOrExpiredResetToken.Code);
    }

    [Fact]
    public async Task ResetPasswordHandler_ShouldFail_WhenTokenIsAlreadyUsed()
    {
        await using var context = new AppDbContext(CreateOptions());
        await DatabaseSeeder.SeedAsync(context);

        var user = await context.Users.FirstAsync(u => u.Email == "jorge@admin.com");

        var rawToken = "already_used_token_12345";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        var resetToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(20),
            UsedAt = DateTime.UtcNow.AddMinutes(-2), // Ya usado
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };
        await context.PasswordResetTokens.AddAsync(resetToken);
        await context.SaveChangesAsync();

        var mockHasher = new Mock<IPasswordHasher>();
        var handler = new ResetPasswordHandler(context, mockHasher.Object);

        var request = new ResetPasswordRequest("jorge@admin.com", rawToken, "NuevaClaveSegura2026!");
        var result = await handler.Handle(request);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(AuthErrors.InvalidOrExpiredResetToken.Code);
    }

    [Fact]
    public void HtmlEmailTemplateEngine_RenderPasswordReset_ShouldContainResetUrlAndToken()
    {
        var engine = new HtmlEmailTemplateEngine();
        var model = new PasswordResetEmailModel
        {
            Brand = new BrandEmailContext { BrandName = "La Granjita", PrimaryColor = "#E4002B" },
            UserName = "David",
            ResetUrl = "https://mesafy.doicela.dev/la-granjita/login?tab=reset-password&token=test_tok_123",
            ResetToken = "test_tok_123",
            ExpirationMinutes = 30
        };

        var (html, text) = engine.Render(EmailTemplateType.PasswordReset, model);

        WebUtility.HtmlDecode(html).Should().Contain("Restablecimiento de Contraseña");
        html.Should().Contain("David");
        WebUtility.HtmlDecode(html).Should().Contain(model.ResetUrl);
        html.Should().Contain("test_tok_123");
        html.Should().Contain("30 minutos");

        text.Should().Contain("David");
        text.Should().Contain(model.ResetUrl);
        text.Should().Contain("test_tok_123");
    }
}
