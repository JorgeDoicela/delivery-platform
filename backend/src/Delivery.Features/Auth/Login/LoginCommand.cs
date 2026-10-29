namespace Delivery.Features.Auth.Login;

public record LoginCommand(
    string Email,
    string Password,
    string? TenantSlug = null,
    string? IpAddress = null);

