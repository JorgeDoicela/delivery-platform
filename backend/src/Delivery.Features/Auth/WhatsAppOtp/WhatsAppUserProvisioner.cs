using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;
using RefreshTokenEntity = Delivery.Core.Domain.Entities.RefreshToken;

namespace Delivery.Features.Auth.WhatsAppOtp;

internal static class WhatsAppUserProvisioner
{
    public static async Task<Result<WhatsAppLoginResponse>> AuthenticateOrProvisionAsync(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        ITokenProvider tokenProvider,
        string rawPhone,
        string? contactName,
        string? tenantSlug,
        CancellationToken cancellationToken)
    {
        var normalized = WhatsAppOtpNormalizer.Normalize(rawPhone);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return Result.Failure<WhatsAppLoginResponse>(AuthErrors.InvalidPhoneNumber);
        }

        Tenant? tenant = null;
        if (!string.IsNullOrWhiteSpace(tenantSlug))
        {
            var slug = tenantSlug.Trim().ToLowerInvariant();
            tenant = await context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == slug, cancellationToken);
        }

        var suffix = normalized.Length >= 8 ? normalized[^8..] : normalized;

        var matchingUsers = await context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Where(u => u.IsActive && !string.IsNullOrEmpty(u.Phone) && (u.Phone == normalized || u.Phone.EndsWith(suffix)))
            .ToListAsync(cancellationToken);

        // Priorizar coincidencia exacta; luego cliente del mismo tenant; luego cualquier cliente
        var user = matchingUsers.FirstOrDefault(u => u.Phone == normalized && (tenant == null || u.TenantId == tenant.Id || u.TenantId == null))
                   ?? matchingUsers.FirstOrDefault(u => u.Phone == normalized)
                   ?? matchingUsers.FirstOrDefault(u => tenant != null && u.TenantId == tenant.Id)
                   ?? matchingUsers.FirstOrDefault();

        if (user != null)
        {
            var hasStaffRole = user.UserRoles.Any(ur => ur.RoleId != Role.Customer);
            if (hasStaffRole)
            {
                return Result.Failure<WhatsAppLoginResponse>(AuthErrors.StaffMustUsePasswordLogin);
            }

            if (tenant == null && user.Tenant != null)
            {
                tenant = user.Tenant;
            }
        }
        else
        {
            var existingCustomer = await context.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    c => !string.IsNullOrEmpty(c.Phone) && (c.Phone == normalized || c.Phone.EndsWith(suffix)),
                    cancellationToken);

            var defaultEmail = !string.IsNullOrWhiteSpace(existingCustomer?.Email)
                ? existingCustomer.Email.Trim().ToLowerInvariant()
                : $"wa_{normalized}@mesafy.local";

            var defaultFullName = !string.IsNullOrWhiteSpace(contactName)
                ? contactName.Trim()
                : !string.IsNullOrWhiteSpace(existingCustomer?.FullName)
                    ? existingCustomer.FullName.Trim()
                    : $"Cliente {normalized[^4..]}";

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant?.Id ?? existingCustomer?.TenantId,
                Email = defaultEmail,
                FullName = defaultFullName,
                Phone = normalized,
                PasswordHash = passwordHasher.Hash(Guid.NewGuid().ToString("N")),
                IsActive = true,
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddAsync(newUser, cancellationToken);

            var userRole = new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = newUser.Id,
                RoleId = Role.Customer
            };

            await context.UserRoles.AddAsync(userRole, cancellationToken);

            if (tenant != null && existingCustomer == null)
            {
                var newCustomer = new Customer
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    FullName = newUser.FullName,
                    Email = newUser.Email,
                    Phone = normalized,
                    IdentificationType = "CONSUMIDOR_FINAL",
                    IdentificationNumber = $"CF-{newUser.Id:N}"[..18],
                    CreatedAt = DateTime.UtcNow,
                    TotalOrdersCount = 0
                };
                await context.Customers.AddAsync(newCustomer, cancellationToken);
            }

            await context.SaveChangesAsync(cancellationToken);

            var customerRole = await context.Roles.FirstOrDefaultAsync(r => r.Id == Role.Customer, cancellationToken);
            if (customerRole != null)
            {
                userRole.Role = customerRole;
            }

            newUser.UserRoles.Add(userRole);
            user = newUser;
        }

        var roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role)
            .ToList();

        var (accessToken, expiresAt) = tokenProvider.GenerateAccessToken(user, roles, user.TenantId, null);
        var (rawRefreshToken, hashedRefreshToken, refreshExpiresAt) = tokenProvider.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = hashedRefreshToken,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow
        };

        await context.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var primaryRole = roles.FirstOrDefault()?.Name ?? "Customer";
        var userAuthInfo = new WhatsAppUserAuthInfoDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            primaryRole,
            user.TenantId,
            tenant?.Slug ?? user.Tenant?.Slug,
            null,
            user.IsActive,
            roles.Select(r => r.Name).ToList(),
            user.IsEmailVerified,
            user.AvatarUrl);

        return Result.Success(new WhatsAppLoginResponse(accessToken, rawRefreshToken, expiresAt, userAuthInfo));
    }
}
