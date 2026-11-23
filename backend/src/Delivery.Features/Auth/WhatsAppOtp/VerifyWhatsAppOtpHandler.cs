using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using RefreshTokenEntity = Delivery.Core.Domain.Entities.RefreshToken;

namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed record VerifyWhatsAppOtpCommand(string Phone, string Code, string? TenantSlug = null);

public sealed class VerifyWhatsAppOtpHandler : IHandler<VerifyWhatsAppOtpCommand, Result<WhatsAppLoginResponse>>
{
    private readonly AppDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenProvider _tokenProvider;

    public VerifyWhatsAppOtpHandler(
        AppDbContext context,
        IConnectionMultiplexer redis,
        IPasswordHasher passwordHasher,
        ITokenProvider tokenProvider)
    {
        _context = context;
        _redis = redis;
        _passwordHasher = passwordHasher;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result<WhatsAppLoginResponse>> Handle(VerifyWhatsAppOtpCommand request, CancellationToken cancellationToken = default)
    {
        var normalized = WhatsAppOtpNormalizer.Normalize(request.Phone);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return Result.Failure<WhatsAppLoginResponse>(AuthErrors.InvalidPhoneNumber);
        }

        var db = _redis.GetDatabase();
        var otpKey = $"auth:whatsapp:otp:{normalized}";
        var storedCode = await db.StringGetAsync(otpKey);

        if (!storedCode.HasValue || string.IsNullOrWhiteSpace(request.Code) || storedCode.ToString() != request.Code.Trim())
        {
            return Result.Failure<WhatsAppLoginResponse>(AuthErrors.InvalidOtpCode);
        }

        // Una vez verificado, invalidar el OTP en Redis para prevenir reuso
        await db.KeyDeleteAsync(otpKey);

        // Buscar si existe un usuario previo con este número (por sufijo de 8 dígitos para compatibilidad nacional/internacional)
        var suffix = normalized.Length >= 8 ? normalized[^8..] : normalized;

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.IsActive && u.Phone.EndsWith(suffix), cancellationToken);

        Tenant? tenant = null;
        if (!string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            var slug = request.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == slug, cancellationToken);
        }

        // Si el usuario no existe, provisionar cuenta de cliente automática vinculando al historial de pedidos
        if (user == null)
        {
            var customer = await _context.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Phone.EndsWith(suffix), cancellationToken);

            var defaultEmail = !string.IsNullOrWhiteSpace(customer?.Email)
                ? customer.Email.Trim().ToLowerInvariant()
                : $"wa_{normalized}@mesafy.local";

            var defaultFullName = !string.IsNullOrWhiteSpace(customer?.FullName)
                ? customer.FullName.Trim()
                : $"Cliente {normalized[^4..]}";

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant?.Id ?? customer?.TenantId,
                Email = defaultEmail,
                FullName = defaultFullName,
                Phone = normalized,
                PasswordHash = _passwordHasher.Hash(Guid.NewGuid().ToString("N")),
                IsActive = true,
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(newUser, cancellationToken);

            var userRole = new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = newUser.Id,
                RoleId = Delivery.Core.Domain.Entities.Role.Customer
            };

            await _context.UserRoles.AddAsync(userRole, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Id == Delivery.Core.Domain.Entities.Role.Customer, cancellationToken);
            if (customerRole != null)
            {
                userRole.Role = customerRole;
            }
            newUser.UserRoles.Add(userRole);
            user = newUser;
        }

        // Generar tokens JWT
        var roles = user.UserRoles.Select(ur => ur.Role).ToList();
        var (accessToken, expiresAt) = _tokenProvider.GenerateAccessToken(user, roles, user.TenantId, null);
        var (rawRefreshToken, hashedRefreshToken, refreshExpiresAt) = _tokenProvider.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = hashedRefreshToken,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow
        };

        await _context.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var primaryRole = user.UserRoles.FirstOrDefault()?.Role.Name ?? "Customer";
        var userAuthInfo = new WhatsAppUserAuthInfoDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            primaryRole,
            user.TenantId,
            tenant?.Slug,
            null,
            user.IsActive,
            roles.Select(r => r.Name).ToList(),
            user.IsEmailVerified,
            user.AvatarUrl
        );

        return Result.Success(new WhatsAppLoginResponse(accessToken, rawRefreshToken, expiresAt, userAuthInfo));
    }
}
