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
        // 1. Resolucion segura del Tenant (priorizando el TenantSlug explícito de la petición o el contexto del host)
        Tenant? tenant = null;

        if (!string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            var requestedSlug = request.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == requestedSlug, cancellationToken);

            if (tenant == null)
            {
                return Result.Failure<LoginResponse>(AuthErrors.TenantNotFound);
            }
        }
        else if (_tenantContext.TenantId.HasValue)
        {
            tenant = await _context.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId.Value, cancellationToken);

            if (tenant == null)
            {
                return Result.Failure<LoginResponse>(AuthErrors.TenantNotFound);
            }
        }

        // 2. Busqueda del usuario dentro del tenant o global (SuperAdmin o Customer en Plataforma)
#pragma warning disable CA1862, CA1304, CA1311
        var emailLower = request.Email.Trim().ToLower(System.Globalization.CultureInfo.InvariantCulture);
        User? user;

        if (tenant != null)
        {
            // Contexto de un restaurante específico (dominio propio, subdominio o /[slug]/login):
            // Solo se permite acceso a usuarios que pertenezcan a este restaurante (u.TenantId == tenant.Id)
            // o a cuentas globales de plataforma (u.TenantId == null). Cero cruce con otros comercios.
            user = await _context.Users.IgnoreQueryFilters()
                .Include(u => u.Tenant)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => (u.TenantId == tenant.Id || u.TenantId == null) && u.Email.ToLower() == emailLower, cancellationToken);
        }
        else
        {
            // Contexto de Plataforma Global (mesafy.doicela.dev):
            // Busqueda global por email para permitir login de administradores, comensales globales o miembros de restaurantes.
            user = await _context.Users.IgnoreQueryFilters()
                .Include(u => u.Tenant)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower, cancellationToken);

            if (user?.Tenant != null)
            {
                if (!user.Tenant.IsActive)
                {
                    return Result.Failure<LoginResponse>(AuthErrors.TenantInactive);
                }
                tenant = user.Tenant;
            }
        }
#pragma warning restore CA1862, CA1304, CA1311

        if (user == null)
        {
            return Result.Failure<LoginResponse>(AuthErrors.InvalidCredentials);
        }

        // Si el usuario pertenece a un comercio específico, verificar que esté activo
        if (user.TenantId.HasValue && tenant != null && !tenant.IsActive)
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

        // 6. Generacion criptografica de tokens (respetando TenantId nulo para SuperAdmin o Customer global)
        var effectiveTenantId = user.TenantId;
        var (accessToken, accessExpiresAt) = _tokenProvider.GenerateAccessToken(user, roles, effectiveTenantId, primaryBranchId);
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
            user.Tenant?.Slug ?? tenant?.Slug,
            primaryBranchId,
            user.IsActive,
            roleNames,
            user.IsEmailVerified,
            user.AvatarUrl);

        var response = new LoginResponse(accessToken, rawRefreshToken, accessExpiresAt, userDto);
        return Result.Success(response);
    }
}
