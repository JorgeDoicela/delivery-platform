namespace Delivery.Features.Auth.Login;

public record LoginRequest(string Email, string Password, string? TenantSlug = null);

public record UserAuthInfoDto(
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
    bool IsEmailVerified = false);

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserAuthInfoDto User);

