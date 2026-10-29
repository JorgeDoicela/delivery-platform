namespace Delivery.Features.Auth.Login;

public record LoginRequest(string Email, string Password, string? TenantSlug);

public record UserAuthInfoDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    Guid? TenantId,
    int? BranchId,
    List<string> Roles);

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserAuthInfoDto User);

