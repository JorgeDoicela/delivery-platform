namespace Delivery.Features.Auth.Register;

public record RegisterRequest(
    string FullName,
    string Email,
    string Phone,
    string Password,
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
    List<string> Roles);

public record RegisterResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserAuthInfoDto User);
