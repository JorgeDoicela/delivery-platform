using Delivery.Core.Common;

namespace Delivery.Features.Auth.GoogleAuth;

public record GoogleTokenPayload(
    string Sub,
    string Email,
    string Name,
    string? Picture,
    bool EmailVerified);

public interface IGoogleTokenValidator
{
    Task<Result<GoogleTokenPayload>> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
}

