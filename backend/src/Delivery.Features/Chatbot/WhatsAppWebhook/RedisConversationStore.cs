using System.Text.Json;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class RedisConversationStore : IConversationStore
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisConversationStore> _logger;
    private static readonly TimeSpan ConversationTtl = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan DeduplicationTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ConsentTtl = TimeSpan.FromDays(180);
    private const int MaxStoredMessages = 10;

    public RedisConversationStore(IConnectionMultiplexer redis, ILogger<RedisConversationStore> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<List<ChatMessageDto>> GetHistoryAsync(Guid tenantId, string customerPhone, CancellationToken ct = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            var key = GetConversationKey(tenantId, customerPhone);
            var values = await db.ListRangeAsync(key, 0, MaxStoredMessages - 1);

            if (values == null || values.Length == 0)
            {
                return new List<ChatMessageDto>();
            }

            var result = new List<ChatMessageDto>();
            foreach (var val in values)
            {
                if (val.HasValue)
                {
                    var msg = JsonSerializer.Deserialize<ChatMessageDto>(val.ToString()!);
                    if (msg != null)
                    {
                        result.Add(msg);
                    }
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error recuperando historial conversacional de Redis para {Phone}", customerPhone);
            return new List<ChatMessageDto>();
        }
    }

    public async Task AppendMessageAsync(Guid tenantId, string customerPhone, ChatMessageDto message, CancellationToken ct = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            var key = GetConversationKey(tenantId, customerPhone);
            var payload = JsonSerializer.Serialize(message);

            await db.ListRightPushAsync(key, payload);
            await db.ListTrimAsync(key, -MaxStoredMessages, -1);
            await db.KeyExpireAsync(key, ConversationTtl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error guardando mensaje en Redis para {Phone}", customerPhone);
        }
    }

    public async Task<bool> IsMessageProcessedAsync(string messageId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(messageId)) return false;

        try
        {
            var db = _redis.GetDatabase();
            var key = $"whatsapp:dedup:{messageId}";
            return await db.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error verificando idempotencia para {MessageId}", messageId);
            return false;
        }
    }

    public async Task MarkMessageProcessedAsync(string messageId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(messageId)) return;

        try
        {
            var db = _redis.GetDatabase();
            var key = $"whatsapp:dedup:{messageId}";
            await db.StringSetAsync(key, "1", DeduplicationTtl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error marcando mensaje como procesado {MessageId}", messageId);
        }
    }

    public async Task<Guid?> GetActiveTenantSessionAsync(string customerPhone, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone)) return null;

        try
        {
            var db = _redis.GetDatabase();
            var key = GetSessionKey(customerPhone);
            var val = await db.StringGetAsync(key);

            if (val.HasValue && Guid.TryParse(val.ToString(), out var tenantId))
            {
                return tenantId;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error recuperando sesión activa de tenant en Redis para {Phone}", customerPhone);
            return null;
        }
    }

    public async Task SetActiveTenantSessionAsync(string customerPhone, Guid tenantId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone) || tenantId == Guid.Empty) return;

        try
        {
            var db = _redis.GetDatabase();
            var key = GetSessionKey(customerPhone);
            await db.StringSetAsync(key, tenantId.ToString(), ConversationTtl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error guardando sesión activa de tenant en Redis para {Phone}", customerPhone);
        }
    }

    public async Task<bool?> GetCachedConsentAsync(Guid tenantId, string customerPhone, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone) || tenantId == Guid.Empty) return null;

        try
        {
            var db = _redis.GetDatabase();
            var key = GetConsentKey(tenantId, customerPhone);
            var val = await db.StringGetAsync(key);

            if (val.HasValue)
            {
                return val.ToString() == "1";
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error consultando caché de consentimiento en Redis para {Phone}", customerPhone);
            return null;
        }
    }

    public async Task SetCachedConsentAsync(Guid tenantId, string customerPhone, bool hasConsent, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone) || tenantId == Guid.Empty) return;

        try
        {
            var db = _redis.GetDatabase();
            var key = GetConsentKey(tenantId, customerPhone);
            var val = hasConsent ? "1" : "0";
            await db.StringSetAsync(key, val, ConsentTtl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error guardando caché de consentimiento en Redis para {Phone}", customerPhone);
        }
    }

    public async Task RevokeCachedConsentAsync(Guid tenantId, string customerPhone, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone) || tenantId == Guid.Empty) return;

        try
        {
            var db = _redis.GetDatabase();
            var key = GetConsentKey(tenantId, customerPhone);
            await db.StringSetAsync(key, "0", ConsentTtl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error revocando caché de consentimiento en Redis para {Phone}", customerPhone);
        }
    }

    private static string GetConsentKey(Guid tenantId, string customerPhone)
    {
        var cleanPhone = customerPhone.Replace("+", "").Trim();
        return $"whatsapp:consent:{tenantId}:{cleanPhone}";
    }

    private static string GetSessionKey(string customerPhone)
    {
        var cleanPhone = customerPhone.Replace("+", "").Trim();
        return $"whatsapp:session:{cleanPhone}";
    }

    private static string GetConversationKey(Guid tenantId, string customerPhone)
    {
        var cleanPhone = customerPhone.Replace("+", "").Trim();
        return $"whatsapp:conv:{tenantId}:{cleanPhone}";
    }
}

