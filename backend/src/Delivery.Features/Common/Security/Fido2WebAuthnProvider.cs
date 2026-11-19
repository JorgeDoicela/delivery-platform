using Fido2NetLib;
using Fido2NetLib.Objects;
using Delivery.Core.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Delivery.Features.Common.Security;

public class Fido2WebAuthnProvider : IWebAuthnProvider
{
    private readonly IWebAuthnRelyingPartyResolver _rpResolver;
    private readonly IWebAuthnChallengeStore _challengeStore;
    private readonly ILogger<Fido2WebAuthnProvider> _logger;

    public Fido2WebAuthnProvider(
        IWebAuthnRelyingPartyResolver rpResolver,
        IWebAuthnChallengeStore challengeStore,
        ILogger<Fido2WebAuthnProvider> logger)
    {
        _rpResolver = rpResolver;
        _challengeStore = challengeStore;
        _logger = logger;
    }

    public async Task<CredentialCreateOptions> GenerateRegistrationOptionsAsync(
        User user,
        Tenant? tenant,
        IEnumerable<byte[]> existingCredentialIds,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default)
    {
        var config = _rpResolver.ResolveConfiguration(tenant, clientOrigin);
        var fido2 = new Fido2(config);

        var existingDescriptors = existingCredentialIds
            .Select(id => new PublicKeyCredentialDescriptor(id))
            .ToList();

        var fidoUser = new Fido2User
        {
            Id = user.Id.ToByteArray(),
            Name = user.Email,
            DisplayName = string.IsNullOrWhiteSpace(user.FullName) ? user.Email : user.FullName
        };

        var requestParams = new RequestNewCredentialParams
        {
            User = fidoUser,
            ExcludeCredentials = existingDescriptors,
            AuthenticatorSelection = new AuthenticatorSelection
            {
                UserVerification = UserVerificationRequirement.Preferred,
                ResidentKey = ResidentKeyRequirement.Preferred
            },
            AttestationPreference = AttestationConveyancePreference.None
        };

        var options = fido2.RequestNewCredential(requestParams);

        var challengeKey = $"webauthn:reg:{user.Id}";
        var serialized = options.ToJson();
        await _challengeStore.StoreChallengeAsync(challengeKey, serialized, TimeSpan.FromMinutes(5), cancellationToken);

        _logger.LogInformation("WebAuthn: Opciones de registro generadas para UserId: {UserId}, RP: {RpId}", user.Id, config.RPID);
        return options;
    }

    public async Task<RegisteredPublicKeyCredential> VerifyRegistrationAsync(
        Guid userId,
        AuthenticatorAttestationRawResponse clientResponse,
        Tenant? tenant,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default)
    {
        var challengeKey = $"webauthn:reg:{userId}";
        var serializedOptions = await _challengeStore.RetrieveAndRemoveChallengeAsync(challengeKey, cancellationToken);

        if (string.IsNullOrWhiteSpace(serializedOptions))
        {
            throw new InvalidOperationException("Challenge de registro no encontrado o expirado.");
        }

        var originalOptions = CredentialCreateOptions.FromJson(serializedOptions);
        var config = _rpResolver.ResolveConfiguration(tenant, clientOrigin);
        var fido2 = new Fido2(config);

        var makeParams = new MakeNewCredentialParams
        {
            AttestationResponse = clientResponse,
            OriginalOptions = originalOptions,
            IsCredentialIdUniqueToUserCallback = (args, ct) => Task.FromResult(true)
        };

        var result = await fido2.MakeNewCredentialAsync(makeParams, cancellationToken);
        _logger.LogInformation("WebAuthn: Registro verificado exitosamente para UserId: {UserId}", userId);
        return result;
    }

    public async Task<(AssertionOptions Options, string SessionId)> GenerateLoginOptionsAsync(
        User? user,
        Tenant? tenant,
        IEnumerable<byte[]>? allowedCredentialIds = null,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default)
    {
        var config = _rpResolver.ResolveConfiguration(tenant, clientOrigin);
        var fido2 = new Fido2(config);

        var allowedDescriptors = allowedCredentialIds?
            .Select(id => new PublicKeyCredentialDescriptor(id))
            .ToList() ?? new List<PublicKeyCredentialDescriptor>();

        var getParams = new GetAssertionOptionsParams
        {
            AllowedCredentials = allowedDescriptors,
            UserVerification = UserVerificationRequirement.Preferred
        };

        var options = fido2.GetAssertionOptions(getParams);

        var sessionId = Guid.NewGuid().ToString("N");
        var challengeKey = $"webauthn:login:{sessionId}";
        var serialized = options.ToJson();
        await _challengeStore.StoreChallengeAsync(challengeKey, serialized, TimeSpan.FromMinutes(5), cancellationToken);

        _logger.LogInformation("WebAuthn: Opciones de login generadas con SessionId: {SessionId}, RP: {RpId}", sessionId, config.RPID);
        return (options, sessionId);
    }

    public async Task<VerifyAssertionResult> VerifyLoginAsync(
        string sessionId,
        AuthenticatorAssertionRawResponse clientResponse,
        byte[] storedPublicKey,
        uint storedSignCount,
        Guid expectedUserId,
        Tenant? tenant,
        string? clientOrigin = null,
        CancellationToken cancellationToken = default)
    {
        var challengeKey = $"webauthn:login:{sessionId}";
        var serializedOptions = await _challengeStore.RetrieveAndRemoveChallengeAsync(challengeKey, cancellationToken);

        if (string.IsNullOrWhiteSpace(serializedOptions))
        {
            throw new InvalidOperationException("Sesión de autenticación WebAuthn no encontrada o expirada.");
        }

        var originalOptions = AssertionOptions.FromJson(serializedOptions);
        var config = _rpResolver.ResolveConfiguration(tenant, clientOrigin);
        var fido2 = new Fido2(config);

        var makeParams = new MakeAssertionParams
        {
            AssertionResponse = clientResponse,
            OriginalOptions = originalOptions,
            StoredPublicKey = storedPublicKey,
            StoredSignatureCounter = storedSignCount,
            IsUserHandleOwnerOfCredentialIdCallback = (args, ct) =>
            {
                if (args.UserHandle == null || args.UserHandle.Length == 0)
                {
                    return Task.FromResult(true);
                }

                var handleGuid = new Guid(args.UserHandle);
                return Task.FromResult(handleGuid == expectedUserId);
            }
        };

        var result = await fido2.MakeAssertionAsync(makeParams, cancellationToken);
        _logger.LogInformation("WebAuthn: Aserción verificada exitosamente para UserId: {UserId}", expectedUserId);
        return result;
    }
}
