namespace Delivery.Features.Auth.GetCurrentUser;

public record UserInfoDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    Guid? TenantId,
    string? TenantName,
    string? TenantSlug,
    int? BranchId,
    string? BranchName,
    List<string> Roles);

