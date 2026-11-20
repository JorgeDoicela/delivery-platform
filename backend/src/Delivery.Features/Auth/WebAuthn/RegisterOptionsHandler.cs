using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Fido2NetLib;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.WebAuthn;

public record RegisterOptionsCommand(Guid UserId, string? TenantSlug, string? ClientOrigin);

public class RegisterOptionsHandler : IHandler<RegisterOptionsCommand, Result<CredentialCreateOptions>>
{
    private readonly AppDbContext _context;
    private readonly IWebAuthnProvider _webAuthnProvider;

    public RegisterOptionsHandler(
        AppDbContext context,
        IWebAuthnProvider webAuthnProvider)
    {
        _context = context;
        _webAuthnProvider = webAuthnProvider;
    }

    public async Task<Result<CredentialCreateOptions>> Handle(RegisterOptionsCommand command, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Tenant)
            .Include(u => u.WebAuthnCredentials)
            .FirstOrDefaultAsync(u => u.Id == command.UserId, cancellationToken);

        if (user == null)
        {
            return Result.Failure<CredentialCreateOptions>(AuthErrors.UserNotFound);
        }

        if (!user.IsActive)
        {
            return Result.Failure<CredentialCreateOptions>(AuthErrors.UserInactive);
        }

        Tenant? tenant = user.Tenant;
        if (tenant == null && !string.IsNullOrWhiteSpace(command.TenantSlug))
        {
            var slugLower = command.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants.FirstOrDefaultAsync(t => string.Equals(t.Slug, slugLower, StringComparison.OrdinalIgnoreCase), cancellationToken);
        }

        var existingCredentialIds = user.WebAuthnCredentials
            .Select(c => c.CredentialId)
            .ToList();

        var options = await _webAuthnProvider.GenerateRegistrationOptionsAsync(
            user,
            tenant,
            existingCredentialIds,
            command.ClientOrigin,
            cancellationToken);

        return Result.Success(options);
    }
}
