namespace Delivery.Features.Auth.RefreshToken;

public record RefreshTokenCommand(string RawToken, string? IpAddress = null);

