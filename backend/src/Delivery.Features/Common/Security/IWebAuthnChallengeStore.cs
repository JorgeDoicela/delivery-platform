namespace Delivery.Features.Common.Security;

public interface IWebAuthnChallengeStore
{
    Task StoreChallengeAsync(string key, string serializedData, TimeSpan? expiry = null, CancellationToken ct = default);
    Task<string?> RetrieveAndRemoveChallengeAsync(string key, CancellationToken ct = default);
    Task<string?> GetChallengeAsync(string key, CancellationToken ct = default);
}
