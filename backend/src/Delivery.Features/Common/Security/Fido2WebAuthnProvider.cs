using Fido2NetLib;
using Fido2NetLib.Objects;
using Delivery.Core.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Delivery.Features.Common.Security;

public partial class Fido2WebAuthnProvider : IWebAuthnProvider
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

        LogRegistrationOptionsGenerated(_logger, user.Id, config.RPID ?? string.Empty);
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
        LogRegistrationVerified(_logger, userId);
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

        LogLoginOptionsGenerated(_logger, sessionId, config.RPID ?? string.Empty);
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
        LogLoginVerified(_logger, expectedUserId);
        return result;
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "WebAuthn: Opciones de registro generadas para UserId: {UserId}, RP: {RpId}")]
    private static partial void LogRegistrationOptionsGenerated(ILogger logger, Guid userId, string rpId);

    [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "WebAuthn: Registro verificado exitosamente para UserId: {UserId}")]
    private static partial void LogRegistrationVerified(ILogger logger, Guid userId);

    [LoggerMessage(EventId = 3, Level = LogLevel.Information, Message = "WebAuthn: Opciones de login generadas con SessionId: {SessionId}, RP: {RpId}")]
    private static partial void LogLoginOptionsGenerated(ILogger logger, string sessionId, string rpId);

    [LoggerMessage(EventId = 4, Level = LogLevel.Information, Message = "WebAuthn: Aserción verificada exitosamente para UserId: {UserId}")]
    private static partial void LogLoginVerified(ILogger logger, Guid userId);
}
