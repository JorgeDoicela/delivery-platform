using System.Globalization;
using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;
using RefreshTokenEntity = Delivery.Core.Domain.Entities.RefreshToken;

namespace Delivery.Features.Auth.GoogleAuth;

public class GoogleAuthHandler : IHandler<GoogleAuthCommand, Result<GoogleAuthResponse>>
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IGoogleTokenValidator _googleTokenValidator;
    private readonly ITokenProvider _tokenProvider;

    public GoogleAuthHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IGoogleTokenValidator googleTokenValidator,
        ITokenProvider tokenProvider)
    {
        _context = context;
        _tenantContext = tenantContext;
        _googleTokenValidator = googleTokenValidator;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result<GoogleAuthResponse>> Handle(GoogleAuthCommand request, CancellationToken cancellationToken = default)
    {
        // 1. Verificación del Google ID Token
        var tokenValidationResult = await _googleTokenValidator.ValidateAsync(request.IdToken, cancellationToken);
        if (!tokenValidationResult.IsSuccess)
        {
            return Result.Failure<GoogleAuthResponse>(tokenValidationResult.Error);
        }

        var googlePayload = tokenValidationResult.Value;

        // 2. Resolución del Tenant (marca o franquicia)
        Tenant? tenant = null;

        if (!string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            var requestedSlug = request.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == requestedSlug, cancellationToken);
        }
        else if (_tenantContext.TenantId.HasValue)
        {
            tenant = await _context.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId.Value, cancellationToken);
        }
        else
        {
            tenant = await _context.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == "la-granjita", cancellationToken)
                ?? await _context.Tenants.IgnoreQueryFilters()
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.Id)
                    .FirstOrDefaultAsync(cancellationToken);
        }

        if (tenant == null)
        {
            return Result.Failure<GoogleAuthResponse>(AuthErrors.TenantNotFound);
        }

        if (!tenant.IsActive)
        {
            return Result.Failure<GoogleAuthResponse>(AuthErrors.TenantInactive);
        }

        // 3. Búsqueda de usuario existente por correo verificado
        var emailLower = googlePayload.Email.Trim().ToLower(CultureInfo.InvariantCulture);

#pragma warning disable CA1862, CA1304, CA1311
        var user = await _context.Users.IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => (u.TenantId == tenant.Id || u.TenantId == null) && u.Email.ToLower() == emailLower, cancellationToken);

        // Si el usuario existe en otro tenant y no se forzó tenantSlug en request, resolver su propio tenant
        if (user == null && string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            user = await _context.Users.IgnoreQueryFilters()
                .Include(u => u.Tenant)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower, cancellationToken);

            if (user?.Tenant != null)
            {
                tenant = user.Tenant;
            }
        }
#pragma warning restore CA1862, CA1304, CA1311

        // 4. Si el usuario no existe, aprovisionamiento automático (Just-In-Time) como cliente
        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Email = emailLower,
                FullName = !string.IsNullOrWhiteSpace(googlePayload.Name) ? googlePayload.Name.Trim() : emailLower.Split('@')[0],
                Phone = string.Empty,
                PasswordHash = string.Empty, // Autenticación federada delegada a Google OpenID Connect
                IsActive = true,
                IsEmailVerified = true, // Correo validado criptográficamente por Google Identity
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user, cancellationToken);

            var userRole = new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                RoleId = Role.Customer
            };

            await _context.UserRoles.AddAsync(userRole, cancellationToken);

            // Registro en directorio de clientes del tenant
#pragma warning disable CA1862, CA1304, CA1311
            var customer = await _context.Customers.IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && c.Email != null && c.Email.ToLower() == emailLower, cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

            if (customer == null)
            {
                customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Phone = user.Phone,
                    IdentificationType = "CONSUMIDOR_FINAL",
                    IdentificationNumber = $"CF-{user.Id:N}"[..18],
                    CreatedAt = DateTime.UtcNow,
                    TotalOrdersCount = 0
                };

                await _context.Customers.AddAsync(customer, cancellationToken);
            }

            await _context.SaveChangesAsync(cancellationToken);

            user.Tenant = tenant;
        }

        // 5. Verificación de estado de cuenta y confirmación de correo
        if (!user.IsActive)
        {
            return Result.Failure<GoogleAuthResponse>(AuthErrors.UserInactive);
        }

        if (!user.IsEmailVerified)
        {
            user.IsEmailVerified = true;
        }

        // 6. Extracción de roles y resolución de sucursal primaria
        var rolesList = user.UserRoles
            .Select(ur => ur.Role)
            .Where(r => r != null)
            .ToList();

        if (rolesList.Count == 0)
        {
            var customerRoleEntity = await _context.Roles.FirstOrDefaultAsync(r => r.Id == Role.Customer, cancellationToken);
            rolesList.Add(customerRoleEntity ?? new Role { Id = Role.Customer, Name = "Customer", Description = "Cliente Comensal" });
        }

        var primaryBranchId = user.UserRoles.FirstOrDefault(ur => ur.BranchId.HasValue)?.BranchId;

        // 7. Generación de Access Token (JWT) y Refresh Token respetando Tenant y Sucursal
        var (accessToken, accessExpiresAt) = _tokenProvider.GenerateAccessToken(user, rolesList, user.TenantId, primaryBranchId);
        var (rawRefreshToken, tokenHash, refreshExpiresAt) = _tokenProvider.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = request.IpAddress ?? string.Empty
        };

        await _context.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 8. Construcción de respuesta
        var roleNames = rolesList.Select(r => r.Name).ToList();
        var primaryRole = roleNames.FirstOrDefault() ?? "Customer";

        var userDto = new GoogleUserInfoDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            primaryRole,
            user.TenantId,
            user.Tenant?.Slug ?? tenant.Slug,
            primaryBranchId,
            user.IsActive,
            roleNames,
            googlePayload.Picture,
            user.IsEmailVerified);

        return Result.Success(new GoogleAuthResponse(
            accessToken,
            rawRefreshToken,
            accessExpiresAt,
            userDto));
    }
}
