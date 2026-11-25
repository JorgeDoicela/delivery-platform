namespace Delivery.Features.Common.Security;

public sealed record WhatsAppAuthChallenge(
    string ChallengeId,
    string ShortCode,
    string Status,
    string? TenantSlug,
    string? VerifiedPhone,
    string? ContactName,
    DateTime CreatedAtUtc);

public sealed record WhatsAppMagicLinkPayload(
    string Phone,
    string? ContactName,
    string? TenantSlug,
    string? RedirectPath,
    DateTime CreatedAtUtc);

public interface IWhatsAppAuthChallengeStore
{
    Task<WhatsAppAuthChallenge> CreateChallengeAsync(
        string? tenantSlug,
        TimeSpan? ttl = null,
        CancellationToken ct = default);

    Task<WhatsAppAuthChallenge?> GetChallengeAsync(
        string challengeId,
        CancellationToken ct = default);

    Task<WhatsAppAuthChallenge?> VerifyChallengeByCodeAsync(
        string shortCode,
        string verifiedPhone,
        string? contactName,
        CancellationToken ct = default);

    Task<WhatsAppAuthChallenge?> ConsumeVerifiedChallengeAsync(
        string challengeId,
        CancellationToken ct = default);

    Task<string> CreateMagicLinkAsync(
        string phone,
        string? contactName,
        string? tenantSlug,
        string? redirectPath = null,
        TimeSpan? ttl = null,
        CancellationToken ct = default);

    Task<WhatsAppMagicLinkPayload?> ConsumeMagicLinkAsync(
        string token,
        CancellationToken ct = default);
}
