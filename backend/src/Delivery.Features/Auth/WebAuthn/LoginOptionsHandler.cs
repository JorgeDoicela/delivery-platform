using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.WebAuthn;

public record LoginOptionsCommand(
    string? Email,
    string? TenantSlug,
    string? ClientOrigin);

public class LoginOptionsHandler : IHandler<LoginOptionsCommand, Result<WebAuthnLoginOptionsResponse>>
{
    private readonly AppDbContext _context;
    private readonly IWebAuthnProvider _webAuthnProvider;

    public LoginOptionsHandler(
        AppDbContext context,
        IWebAuthnProvider webAuthnProvider)
    {
        _context = context;
        _webAuthnProvider = webAuthnProvider;
    }

    public async Task<Result<WebAuthnLoginOptionsResponse>> Handle(LoginOptionsCommand command, CancellationToken cancellationToken)
    {
        User? user = null;
        Tenant? tenant = null;
        List<byte[]>? allowedCredentials = null;

        if (!string.IsNullOrWhiteSpace(command.TenantSlug))
        {
            var slugLower = command.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug.ToLower() == slugLower, cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(command.Email))
        {
            var emailLower = command.Email.Trim().ToLowerInvariant();

            IQueryable<User> query = _context.Users
                .Include(u => u.Tenant)
                .Include(u => u.WebAuthnCredentials);

            if (tenant != null)
            {
                query = query.Where(u => u.TenantId == tenant.Id || u.TenantId == null);
            }

            user = await query.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower, cancellationToken);

            if (user != null)
            {
                if (tenant == null && user.Tenant != null)
                {
                    tenant = user.Tenant;
                }

                allowedCredentials = user.WebAuthnCredentials
                    .Select(c => c.CredentialId)
                    .ToList();
            }
        }

        var (options, sessionId) = await _webAuthnProvider.GenerateLoginOptionsAsync(
            user,
            tenant,
            allowedCredentials,
            command.ClientOrigin,
            cancellationToken);

        return Result.Success(new WebAuthnLoginOptionsResponse(options, sessionId));
    }
}
