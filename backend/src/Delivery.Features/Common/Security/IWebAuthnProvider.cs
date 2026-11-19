using Fido2NetLib;
using Fido2NetLib.Objects;
using Delivery.Core.Domain.Entities;

namespace Delivery.Features.Common.Security;

public interface IWebAuthnProvider
{
    Task<CredentialCreateOptions> GenerateRegistrationOptionsAsync(
        User user,
        Tenant? tenant,
        IEnumerable<byte[]> existingCredentialIds,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default);

    Task<RegisteredPublicKeyCredential> VerifyRegistrationAsync(
        Guid userId,
        AuthenticatorAttestationRawResponse clientResponse,
        Tenant? tenant,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default);

    Task<(AssertionOptions Options, string SessionId)> GenerateLoginOptionsAsync(
        User? user,
        Tenant? tenant,
        IEnumerable<byte[]>? allowedCredentialIds = null,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default);

    Task<VerifyAssertionResult> VerifyLoginAsync(
        string sessionId,
        AuthenticatorAssertionRawResponse clientResponse,
        byte[] storedPublicKey,
        uint storedSignCount,
        Guid expectedUserId,
        Tenant? tenant,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default);
}
