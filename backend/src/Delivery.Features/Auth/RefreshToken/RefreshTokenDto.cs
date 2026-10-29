namespace Delivery.Features.Auth.RefreshToken;

public record RefreshTokenRequest(string? RefreshToken);

public record RefreshTokenResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt);

