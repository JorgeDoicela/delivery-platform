using Fido2NetLib;

namespace Delivery.Features.Auth.WebAuthn;

public record WebAuthnRegisterOptionsRequest(string? TenantSlug = null);

public record WebAuthnRegisterCompleteRequest(
    AuthenticatorAttestationRawResponse Attestation,
    string? FriendlyName = null,
    string? TenantSlug = null);

public record WebAuthnLoginOptionsRequest(
    string? Email = null,
    string? TenantSlug = null);

public record WebAuthnLoginOptionsResponse(
    AssertionOptions Options,
    string SessionId);

public record WebAuthnLoginCompleteRequest(
    string SessionId,
    AuthenticatorAssertionRawResponse Assertion,
    string? TenantSlug = null);

public record WebAuthnUserInfoDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    Guid? TenantId,
    string? TenantSlug,
    int? BranchId,
    bool IsActive,
    List<string> Roles,
    bool IsEmailVerified = false,
    string? AvatarUrl = null);

public record WebAuthnLoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    WebAuthnUserInfoDto User);

public record WebAuthnCredentialDto(
    Guid Id,
    string FriendlyName,
    string? AuthenticatorType,
    string AttestationFormat,
    DateTime CreatedAt,
    DateTime? LastUsedAt,
    uint SignCount);

public record UpdateWebAuthnCredentialRequest(string FriendlyName);
