using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;
using RefreshTokenEntity = Delivery.Core.Domain.Entities.RefreshToken;

namespace Delivery.Features.Auth.RefreshToken;

public class RefreshTokenHandler : IHandler<RefreshTokenCommand, Result<RefreshTokenResponse>>
{
    private readonly AppDbContext _context;
    private readonly ITokenProvider _tokenProvider;

    public RefreshTokenHandler(AppDbContext context, ITokenProvider tokenProvider)
    {
        _context = context;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result<RefreshTokenResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RawToken))
        {
            return Result.Failure<RefreshTokenResponse>(AuthErrors.InvalidRefreshToken);
        }

        var tokenHash = _tokenProvider.HashToken(request.RawToken);

        var existingToken = await _context.RefreshTokens.IgnoreQueryFilters()
            .Include(rt => rt.User)
                .ThenInclude(u => u.Tenant)
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (existingToken == null || existingToken.RevokedAt.HasValue || existingToken.ExpiresAt <= DateTime.UtcNow)
        {
            return Result.Failure<RefreshTokenResponse>(AuthErrors.InvalidRefreshToken);
        }

        var user = existingToken.User;
        if (!user.IsActive)
        {
            return Result.Failure<RefreshTokenResponse>(AuthErrors.UserInactive);
        }

        // 1. Revocacion del Refresh Token anterior (Rotacion estricta)
        existingToken.RevokedAt = DateTime.UtcNow;

        // 2. Generacion de nuevos tokens
        var roles = user.UserRoles.Select(ur => ur.Role).ToList();
        var primaryBranchId = user.UserRoles.FirstOrDefault(ur => ur.BranchId.HasValue)?.BranchId;

        var (newAccessToken, accessExpiresAt) = _tokenProvider.GenerateAccessToken(user, roles, user.TenantId, primaryBranchId);
        var (newRawToken, newTokenHash, refreshExpiresAt) = _tokenProvider.GenerateRefreshToken();

        // 3. Almacenamiento del nuevo token rotado
        var newRefreshTokenEntity = new RefreshTokenEntity
        {
            UserId = user.Id,
            TokenHash = newTokenHash,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = request.IpAddress ?? string.Empty
        };

        await _context.RefreshTokens.AddAsync(newRefreshTokenEntity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var roleNames = roles.Select(r => r.Name).ToList();
        var primaryRoleName = roleNames.FirstOrDefault() ?? "Customer";

        var userDto = new RefreshUserAuthInfoDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            primaryRoleName,
            user.TenantId,
            user.Tenant?.Slug,
            primaryBranchId,
            user.IsActive,
            roleNames);

        var response = new RefreshTokenResponse(newAccessToken, newRawToken, accessExpiresAt, userDto);
        return Result.Success(response);
    }
}
