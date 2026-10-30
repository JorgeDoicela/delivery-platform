namespace Delivery.Features.Auth.RefreshToken;

public record RefreshTokenRequest(string? RefreshToken = null);

public record RefreshUserAuthInfoDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    Guid? TenantId,
    string? TenantSlug,
    int? BranchId,
    bool IsActive,
    List<string> Roles);

public record RefreshTokenResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    RefreshUserAuthInfoDto User);

