using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.EntityFrameworkCore;
using RefreshTokenEntity = Delivery.Core.Domain.Entities.RefreshToken;

namespace Delivery.Features.Auth.WebAuthn;

public record LoginCompleteCommand(
    string SessionId,
    AuthenticatorAssertionRawResponse Assertion,
    string? TenantSlug,
    string? ClientOrigin,
    string? IpAddress);

public class LoginCompleteHandler : IHandler<LoginCompleteCommand, Result<WebAuthnLoginResponse>>
{
    private readonly AppDbContext _context;
    private readonly IWebAuthnProvider _webAuthnProvider;
    private readonly ITokenProvider _tokenProvider;

    public LoginCompleteHandler(
        AppDbContext context,
        IWebAuthnProvider webAuthnProvider,
        ITokenProvider tokenProvider)
    {
        _context = context;
        _webAuthnProvider = webAuthnProvider;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result<WebAuthnLoginResponse>> Handle(LoginCompleteCommand command, CancellationToken cancellationToken)
    {
        var rawId = command.Assertion.RawId;
        if (rawId == null || rawId.Length == 0)
        {
            return Result.Failure<WebAuthnLoginResponse>(AuthErrors.WebAuthnCredentialNotFound);
        }

        // Buscar la credencial por CredentialId
        var credential = await _context.WebAuthnCredentials
            .IgnoreQueryFilters()
            .Include(c => c.User)
                .ThenInclude(u => u.Tenant)
            .Include(c => c.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(c => c.CredentialId == rawId, cancellationToken);

        if (credential == null)
        {
            return Result.Failure<WebAuthnLoginResponse>(AuthErrors.WebAuthnCredentialNotFound);
        }

        var user = credential.User;
        if (user == null || !user.IsActive)
        {
            return Result.Failure<WebAuthnLoginResponse>(AuthErrors.UserInactive);
        }

        // Si se especificó un TenantSlug, validar pertenencia o SuperAdmin
        Tenant? tenant = user.Tenant;
        if (!string.IsNullOrWhiteSpace(command.TenantSlug))
        {
            var slugLower = command.TenantSlug.Trim().ToLowerInvariant();
            var requestedTenant = await _context.Tenants.FirstOrDefaultAsync(t => EF.Functions.ILike(t.Slug, slugLower), cancellationToken);

            if (requestedTenant != null)
            {
                if (user.TenantId.HasValue && user.TenantId != requestedTenant.Id)
                {
                    return Result.Failure<WebAuthnLoginResponse>(AuthErrors.UnauthorizedTenant);
                }
                tenant ??= requestedTenant;
            }
        }

        if (user.TenantId.HasValue && tenant != null && !tenant.IsActive)
        {
            return Result.Failure<WebAuthnLoginResponse>(AuthErrors.TenantInactive);
        }

        VerifyAssertionResult assertionResult;
        try
        {
            assertionResult = await _webAuthnProvider.VerifyLoginAsync(
                command.SessionId,
                command.Assertion,
                credential.PublicKey,
                credential.SignCount,
                user.Id,
                tenant,
                command.ClientOrigin,
                cancellationToken);
        }
        catch (Exception ex)
        {
            return Result.Failure<WebAuthnLoginResponse>(AuthErrors.WebAuthnVerificationFailed(ex.Message));
        }

        // Actualizar contador y último uso de la credencial
        credential.SignCount = assertionResult.SignCount;
        credential.LastUsedAt = DateTime.UtcNow;

        // Generar tokens de sesión
        var roles = user.UserRoles.Select(ur => ur.Role).ToList();
        var primaryBranchId = user.UserRoles.FirstOrDefault(ur => ur.BranchId.HasValue)?.BranchId;
        var effectiveTenantId = user.TenantId;

        var (accessToken, accessExpiresAt) = _tokenProvider.GenerateAccessToken(user, roles, effectiveTenantId, primaryBranchId);
        var (rawRefreshToken, tokenHash, refreshExpiresAt) = _tokenProvider.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = command.IpAddress ?? string.Empty
        };

        await _context.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var roleNames = roles.Select(r => r.Name).ToList();
        var primaryRoleName = roleNames.FirstOrDefault() ?? "Customer";

        var userDto = new WebAuthnUserInfoDto(
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

        var response = new WebAuthnLoginResponse(
            accessToken,
            rawRefreshToken,
            accessExpiresAt,
            userDto);

        return Result.Success(response);
    }
}
