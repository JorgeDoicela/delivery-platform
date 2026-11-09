namespace Delivery.Features.Auth.Register;

public record RegisterRequest(
    string Email,
    string Password,
    string? FullName = null,
    string? Phone = null,
    string? TenantSlug = null,
    string? IdentificationType = null,
    string? IdentificationNumber = null);

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

public record RegisterResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserAuthInfoDto User);
