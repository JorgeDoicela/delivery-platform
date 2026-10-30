using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;
using RefreshTokenEntity = Delivery.Core.Domain.Entities.RefreshToken;

namespace Delivery.Features.Auth.Login;

public class LoginHandler : IHandler<LoginCommand, Result<LoginResponse>>
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenProvider _tokenProvider;

    public LoginHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IPasswordHasher passwordHasher,
        ITokenProvider tokenProvider)
    {
        _context = context;
        _tenantContext = tenantContext;
        _passwordHasher = passwordHasher;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken = default)
    {
        // 1. Resolucion segura del Tenant (priorizando el TenantSlug explícito de la petición)
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
            // Tenant predeterminado de la plataforma con fallback al primer comercio activo
            tenant = await _context.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == "la-granjita", cancellationToken)
                ?? await _context.Tenants.IgnoreQueryFilters()
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.Id)
                    .FirstOrDefaultAsync(cancellationToken);
        }

        if (tenant == null)
        {
            return Result.Failure<LoginResponse>(AuthErrors.TenantNotFound);
        }

        if (!tenant.IsActive)
        {
            return Result.Failure<LoginResponse>(AuthErrors.TenantInactive);
        }

        // 2. Busqueda del usuario dentro del tenant o global (SuperAdmin)
#pragma warning disable CA1862, CA1304, CA1311
        var emailLower = request.Email.Trim().ToLower(System.Globalization.CultureInfo.InvariantCulture);

        var user = await _context.Users.IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => (u.TenantId == tenant.Id || u.TenantId == null) && u.Email.ToLower() == emailLower, cancellationToken);

        // Si no se especificó un TenantSlug forzado en el request y el usuario pertenece a otro comercio, resolver su propio Tenant
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

        if (user == null)
        {
            return Result.Failure<LoginResponse>(AuthErrors.InvalidCredentials);
        }

        if (!tenant.IsActive)
        {
            return Result.Failure<LoginResponse>(AuthErrors.TenantInactive);
        }

        // 3. Verificacion de contrasena
        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Result.Failure<LoginResponse>(AuthErrors.InvalidCredentials);
        }

        // 4. Verificacion de estado activo del usuario
        if (!user.IsActive)
        {
            return Result.Failure<LoginResponse>(AuthErrors.UserInactive);
        }

        // 5. Resolucion de roles y sucursal primaria asignada
        var roles = user.UserRoles.Select(ur => ur.Role).ToList();
        var primaryBranchId = user.UserRoles.FirstOrDefault(ur => ur.BranchId.HasValue)?.BranchId;

        // 6. Generacion criptografica de tokens
        var (accessToken, accessExpiresAt) = _tokenProvider.GenerateAccessToken(user, roles, tenant.Id, primaryBranchId);
        var (rawRefreshToken, tokenHash, refreshExpiresAt) = _tokenProvider.GenerateRefreshToken();

        // 7. Persistencia inmutable del Refresh Token
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

        var roleNames = roles.Select(r => r.Name).ToList();
        var primaryRoleName = roleNames.FirstOrDefault() ?? "Customer";

        var userDto = new UserAuthInfoDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            primaryRoleName,
            user.TenantId,
            user.Tenant?.Slug ?? (user.TenantId.HasValue ? tenant.Slug : null),
            primaryBranchId,
            user.IsActive,
            roleNames);

        var response = new LoginResponse(accessToken, rawRefreshToken, accessExpiresAt, userDto);
        return Result.Success(response);
    }
}
