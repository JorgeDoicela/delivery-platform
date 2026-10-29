namespace Delivery.Features.Auth.RevokeToken;

public record RevokeTokenRequest(string? RefreshToken);

public record RevokeTokenCommand(string RawToken);

