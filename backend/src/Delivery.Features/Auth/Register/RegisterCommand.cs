namespace Delivery.Features.Auth.Register;

public record RegisterCommand(
    string FullName,
    string Email,
    string Phone,
    string Password,
    string? TenantSlug = null,
    string? IdentificationType = null,
    string? IdentificationNumber = null,
    string? IpAddress = null);

