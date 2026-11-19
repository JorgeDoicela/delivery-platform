using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.WebAuthn;

public record UpdateCredentialCommand(Guid CredentialId, Guid UserId, string FriendlyName);

public class UpdateCredentialHandler : IHandler<UpdateCredentialCommand, Result<WebAuthnCredentialDto>>
{
    private readonly AppDbContext _context;

    public UpdateCredentialHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<WebAuthnCredentialDto>> Handle(UpdateCredentialCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.FriendlyName))
        {
            return Result.Failure<WebAuthnCredentialDto>(new Error("WebAuthn.InvalidName", "El nombre de la llave no puede estar vacío."));
        }

        var credential = await _context.WebAuthnCredentials
            .FirstOrDefaultAsync(c => c.Id == command.CredentialId && c.UserId == command.UserId, cancellationToken);

        if (credential == null)
        {
            return Result.Failure<WebAuthnCredentialDto>(AuthErrors.WebAuthnCredentialNotFound);
        }

        credential.FriendlyName = command.FriendlyName.Trim();
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
