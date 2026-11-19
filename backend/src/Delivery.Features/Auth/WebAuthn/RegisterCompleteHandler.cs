using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.WebAuthn;

public record RegisterCompleteCommand(
    Guid UserId,
    AuthenticatorAttestationRawResponse Attestation,
    string? FriendlyName,
    string? TenantSlug,
    string? ClientOrigin);

public class RegisterCompleteHandler : IHandler<RegisterCompleteCommand, Result<WebAuthnCredentialDto>>
{
    private readonly AppDbContext _context;
    private readonly IWebAuthnProvider _webAuthnProvider;

    public RegisterCompleteHandler(
        AppDbContext context,
        IWebAuthnProvider webAuthnProvider)
    {
        _context = context;
        _webAuthnProvider = webAuthnProvider;
    }

    public async Task<Result<WebAuthnCredentialDto>> Handle(RegisterCompleteCommand command, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == command.UserId, cancellationToken);

        if (user == null)
        {
            return Result.Failure<WebAuthnCredentialDto>(AuthErrors.UserNotFound);
        }

        if (!user.IsActive)
        {
            return Result.Failure<WebAuthnCredentialDto>(AuthErrors.UserInactive);
        }

        Tenant? tenant = user.Tenant;
        if (tenant == null && !string.IsNullOrWhiteSpace(command.TenantSlug))
        {
            var slugLower = command.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug.ToLower() == slugLower, cancellationToken);
        }

        RegisteredPublicKeyCredential verified;
        try
        {
            verified = await _webAuthnProvider.VerifyRegistrationAsync(
                command.UserId,
                command.Attestation,
                tenant,
                command.ClientOrigin,
                cancellationToken);
        }
        catch (Exception ex)
        {
            return Result.Failure<WebAuthnCredentialDto>(AuthErrors.WebAuthnVerificationFailed(ex.Message));
        }

        var friendlyName = string.IsNullOrWhiteSpace(command.FriendlyName)
            ? $"Llave de acceso ({DateTime.UtcNow:dd/MM/yyyy HH:mm})"
            : command.FriendlyName.Trim();

        var credential = new WebAuthnCredential
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TenantId = user.TenantId,
            CredentialId = verified.Id,
            PublicKey = verified.PublicKey,
            SignCount = verified.SignCount,
            CredentialType = verified.Type.ToString(),
            AaGuid = verified.AaGuid,
            FriendlyName = friendlyName,
            AttestationFormat = verified.AttestationFormat,
            AuthenticatorType = verified.AttestationFormat == "none" ? "platform" : "cross-platform",
            CreatedAt = DateTime.UtcNow
        };

        await _context.WebAuthnCredentials.AddAsync(credential, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new WebAuthnCredentialDto(
            credential.Id,
            credential.FriendlyName,
            credential.AuthenticatorType,
            credential.AttestationFormat,
            credential.CreatedAt,
            credential.LastUsedAt,
            credential.SignCount);

        return Result.Success(dto);
    }
}
