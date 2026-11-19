using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.WebAuthn;

public record GetCredentialsQuery(Guid UserId);

public class GetCredentialsHandler : IHandler<GetCredentialsQuery, Result<List<WebAuthnCredentialDto>>>
{
    private readonly AppDbContext _context;

    public GetCredentialsHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<WebAuthnCredentialDto>>> Handle(GetCredentialsQuery query, CancellationToken cancellationToken)
    {
        var credentials = await _context.WebAuthnCredentials
            .Where(c => c.UserId == query.UserId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new WebAuthnCredentialDto(
                c.Id,
                c.FriendlyName,
                c.AuthenticatorType,
                c.AttestationFormat,
                c.CreatedAt,
                c.LastUsedAt,
                c.SignCount))
            .ToListAsync(cancellationToken);

        return Result.Success(credentials);
    }
}
