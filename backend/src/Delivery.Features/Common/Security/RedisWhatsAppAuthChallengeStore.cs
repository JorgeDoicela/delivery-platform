using System.Security.Cryptography;
using System.Text.Json;
using StackExchange.Redis;

namespace Delivery.Features.Common.Security;

public sealed class RedisWhatsAppAuthChallengeStore : IWhatsAppAuthChallengeStore
{
    private const string ChallengePrefix = "auth:wa:challenge:";
    private const string CodeIndexPrefix = "auth:wa:code:";
    private const string MagicPrefix = "auth:wa:magic:";
    private const string CodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    private static readonly TimeSpan DefaultChallengeTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan DefaultMagicLinkTtl = TimeSpan.FromMinutes(15);

    private readonly IConnectionMultiplexer _redis;

    public RedisWhatsAppAuthChallengeStore(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<WhatsAppAuthChallenge> CreateChallengeAsync(
        string? tenantSlug,
        TimeSpan? ttl = null,
        CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        var effectiveTtl = ttl ?? DefaultChallengeTtl;

        var challengeId = GenerateSecureToken(24);
        var shortCode = GenerateShortCode(6);

        var challenge = new WhatsAppAuthChallenge(
            challengeId,
            shortCode,
            "pending",
            string.IsNullOrWhiteSpace(tenantSlug) ? null : tenantSlug.Trim().ToLowerInvariant(),
            null,
            null,
            DateTime.UtcNow);

        var json = JsonSerializer.Serialize(challenge);
        await db.StringSetAsync(ChallengePrefix + challengeId, json, effectiveTtl);
        await db.StringSetAsync(CodeIndexPrefix + shortCode, challengeId, effectiveTtl);

        return challenge;
    }

    public async Task<WhatsAppAuthChallenge?> GetChallengeAsync(
        string challengeId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(challengeId)) return null;

        var db = _redis.GetDatabase();
        var raw = await db.StringGetAsync(ChallengePrefix + challengeId.Trim());
        if (!raw.HasValue) return null;

        return JsonSerializer.Deserialize<WhatsAppAuthChallenge>(raw.ToString());
    }

    public async Task<WhatsAppAuthChallenge?> VerifyChallengeByCodeAsync(
        string shortCode,
        string verifiedPhone,
        string? contactName,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(shortCode) || string.IsNullOrWhiteSpace(verifiedPhone))
        {
            return null;
        }

        var normalizedCode = shortCode.Trim().ToUpperInvariant();
        var db = _redis.GetDatabase();

        var challengeIdVal = await db.StringGetAsync(CodeIndexPrefix + normalizedCode);
        if (!challengeIdVal.HasValue) return null;

        var challengeId = challengeIdVal.ToString();
        var rawChallenge = await db.StringGetAsync(ChallengePrefix + challengeId);
        if (!rawChallenge.HasValue) return null;

        var challenge = JsonSerializer.Deserialize<WhatsAppAuthChallenge>(rawChallenge.ToString());
        if (challenge is null || challenge.Status != "pending") return null;

        var verified = challenge with
        {
            Status = "verified",
            VerifiedPhone = verifiedPhone.Trim(),
            ContactName = string.IsNullOrWhiteSpace(contactName) ? null : contactName.Trim()
        };

        // Mantener el challenge verificado 3 minutos para que el navegador complete el intercambio
        await db.StringSetAsync(
            ChallengePrefix + challengeId,
            JsonSerializer.Serialize(verified),
            TimeSpan.FromMinutes(3));

        // Invalidar el código corto de inmediato para impedir reuso
        await db.KeyDeleteAsync(CodeIndexPrefix + normalizedCode);

        return verified;
    }

    public async Task<WhatsAppAuthChallenge?> ConsumeVerifiedChallengeAsync(
        string challengeId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(challengeId)) return null;

        var db = _redis.GetDatabase();
        var key = ChallengePrefix + challengeId.Trim();
        var raw = await db.StringGetAsync(key);
        if (!raw.HasValue) return null;

        var challenge = JsonSerializer.Deserialize<WhatsAppAuthChallenge>(raw.ToString());
        if (challenge is null || challenge.Status != "verified" || string.IsNullOrWhiteSpace(challenge.VerifiedPhone))
        {
            return null;
        }

        // Consumo único atómico a nivel de aplicación
        var deleted = await db.KeyDeleteAsync(key);
        return deleted ? challenge : null;
    }

    public async Task<string> CreateMagicLinkAsync(
        string phone,
        string? contactName,
        string? tenantSlug,
        string? redirectPath = null,
        TimeSpan? ttl = null,
        CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        var token = GenerateSecureToken(32);
        var effectiveTtl = ttl ?? DefaultMagicLinkTtl;

        var payload = new WhatsAppMagicLinkPayload(
            phone.Trim(),
            string.IsNullOrWhiteSpace(contactName) ? null : contactName.Trim(),
            string.IsNullOrWhiteSpace(tenantSlug) ? null : tenantSlug.Trim().ToLowerInvariant(),
            string.IsNullOrWhiteSpace(redirectPath) ? null : redirectPath.Trim(),
            DateTime.UtcNow);

        await db.StringSetAsync(
            MagicPrefix + token,
            JsonSerializer.Serialize(payload),
            effectiveTtl);

        return token;
    }

    public async Task<WhatsAppMagicLinkPayload?> ConsumeMagicLinkAsync(
        string token,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        var db = _redis.GetDatabase();
        var key = MagicPrefix + token.Trim();
        var raw = await db.StringGetAsync(key);
        if (!raw.HasValue) return null;

        var deleted = await db.KeyDeleteAsync(key);
        if (!deleted) return null;

        return JsonSerializer.Deserialize<WhatsAppMagicLinkPayload>(raw.ToString());
    }

    private static string GenerateSecureToken(int byteLength)
    {
        var bytes = RandomNumberGenerator.GetBytes(byteLength);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string GenerateShortCode(int length)
    {
        var chars = new char[length];
        for (var i = 0; i < length; i++)
        {
            chars[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];
        }

        return new string(chars);
    }
}
