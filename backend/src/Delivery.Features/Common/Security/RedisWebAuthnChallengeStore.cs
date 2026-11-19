using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Delivery.Features.Common.Security;

public class RedisWebAuthnChallengeStore : IWebAuthnChallengeStore
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RedisWebAuthnChallengeStore> _logger;
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(5);

    // Almacén en memoria de respaldo para tests unitarios y contingencia
    private static readonly ConcurrentDictionary<string, (string Data, DateTime ExpiresAt)> InMemoryFallback = new();

    public RedisWebAuthnChallengeStore(
        ILogger<RedisWebAuthnChallengeStore> logger,
        IConnectionMultiplexer? redis = null)
    {
        _logger = logger;
        _redis = redis;
    }

    public async Task StoreChallengeAsync(string key, string serializedData, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        var effectiveExpiry = expiry ?? DefaultExpiry;
        var fullKey = $"webauthn:challenge:{key}";

        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var db = _redis.GetDatabase();
                await db.StringSetAsync(fullKey, serializedData, effectiveExpiry);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo al almacenar challenge de WebAuthn en Redis. Usando fallback en memoria para clave {Key}", key);
            }
        }

        // Fallback en memoria
        InMemoryFallback[fullKey] = (serializedData, DateTime.UtcNow.Add(effectiveExpiry));
    }

    public async Task<string?> RetrieveAndRemoveChallengeAsync(string key, CancellationToken ct = default)
    {
        var fullKey = $"webauthn:challenge:{key}";

        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var db = _redis.GetDatabase();
                var value = await db.StringGetDeleteAsync(fullKey);
                if (value.HasValue)
                {
                    return value.ToString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo al recuperar challenge de WebAuthn en Redis. Revisando fallback en memoria para clave {Key}", key);
            }
        }

        // Revisar en memoria
        if (InMemoryFallback.TryRemove(fullKey, out var entry))
        {
            if (entry.ExpiresAt >= DateTime.UtcNow)
            {
                return entry.Data;
            }
        }

        return null;
    }

    public async Task<string?> GetChallengeAsync(string key, CancellationToken ct = default)
    {
        var fullKey = $"webauthn:challenge:{key}";

        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var db = _redis.GetDatabase();
                var value = await db.StringGetAsync(fullKey);
                if (value.HasValue)
                {
                    return value.ToString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo al consultar challenge de WebAuthn en Redis. Revisando fallback en memoria para clave {Key}", key);
            }
        }

        if (InMemoryFallback.TryGetValue(fullKey, out var entry))
        {
            if (entry.ExpiresAt >= DateTime.UtcNow)
            {
                return entry.Data;
            }
            InMemoryFallback.TryRemove(fullKey, out _);
        }

        return null;
    }
}
