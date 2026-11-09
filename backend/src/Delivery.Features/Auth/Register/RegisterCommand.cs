namespace Delivery.Features.Auth.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string? FullName = null,
    string? Phone = null,
    string? TenantSlug = null,
    string? IdentificationType = null,
    string? IdentificationNumber = null,
    string? IpAddress = null);

