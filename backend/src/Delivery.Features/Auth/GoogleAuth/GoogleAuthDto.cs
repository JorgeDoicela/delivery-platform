namespace Delivery.Features.Auth.GoogleAuth;

public record GoogleAuthRequest(
    string IdToken,
    string? TenantSlug = null);

public record GoogleUserInfoDto(
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
    string? Picture = null,
    bool IsEmailVerified = true);

public record GoogleAuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    GoogleUserInfoDto User);
