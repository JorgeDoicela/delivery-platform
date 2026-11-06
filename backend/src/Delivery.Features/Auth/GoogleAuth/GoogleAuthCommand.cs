namespace Delivery.Features.Auth.GoogleAuth;

public record GoogleAuthCommand(
    string IdToken,
    string? TenantSlug = null,
    string? IpAddress = null);
