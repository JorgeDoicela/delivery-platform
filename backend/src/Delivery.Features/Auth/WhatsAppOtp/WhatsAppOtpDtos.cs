namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed record RequestWhatsAppOtpRequest(string Phone, string? TenantSlug = null);

public sealed record RequestWhatsAppOtpResponse(bool Success, string Message);

public sealed record VerifyWhatsAppOtpRequest(string Phone, string Code, string? TenantSlug = null);

public sealed record WhatsAppUserAuthInfoDto(
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

public sealed record WhatsAppLoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    WhatsAppUserAuthInfoDto User);
