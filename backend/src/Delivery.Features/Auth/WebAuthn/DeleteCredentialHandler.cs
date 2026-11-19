using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.WebAuthn;

public record DeleteCredentialCommand(Guid CredentialId, Guid UserId);

public class DeleteCredentialHandler : IHandler<DeleteCredentialCommand, Result<bool>>
{
    private readonly AppDbContext _context;

    public DeleteCredentialHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteCredentialCommand command, CancellationToken cancellationToken)
    {
        var credential = await _context.WebAuthnCredentials
            .FirstOrDefaultAsync(c => c.Id == command.CredentialId && c.UserId == command.UserId, cancellationToken);

        if (credential == null)
        {
            return Result.Failure<bool>(AuthErrors.WebAuthnCredentialNotFound);
        }

        _context.WebAuthnCredentials.Remove(credential);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(true);
    }
}
