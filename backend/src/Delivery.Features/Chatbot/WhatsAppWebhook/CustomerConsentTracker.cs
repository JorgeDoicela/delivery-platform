using System.Text.Json;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class CustomerConsentTracker : ICustomerConsentTracker
{
    private readonly AppDbContext _db;
    private readonly IConversationStore _conversationStore;
    private readonly ILogger<CustomerConsentTracker> _logger;

    public CustomerConsentTracker(
        AppDbContext db,
        IConversationStore conversationStore,
        ILogger<CustomerConsentTracker> logger)
    {
        _db = db;
        _conversationStore = conversationStore;
        _logger = logger;
    }

    public async Task<bool> HasConsentAsync(Guid tenantId, string customerPhone, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone) || tenantId == Guid.Empty)
        {
            return false;
        }

        // 1. Evaluación ultrarrápida en memoria caché Redis (< 1ms)
        var cached = await _conversationStore.GetCachedConsentAsync(tenantId, customerPhone, ct);
        if (cached.HasValue)
        {
            return cached.Value;
        }

        // 2. Fallback a base de datos PostgreSQL (con búsqueda por últimos 9 dígitos para normalización)
        var cleanPhone = customerPhone.Replace("+", "").Trim();
        var searchDigits = cleanPhone.Length >= 9 ? cleanPhone[^9..] : cleanPhone;

        var hasDbConsent = await _db.CustomerConsents
            .AsNoTracking()
            .IgnoreQueryFilters()
            .AnyAsync(c => c.TenantId == tenantId &&
                           c.PhoneNumber.Contains(searchDigits) &&
                           !c.IsRevoked, ct);

        // 3. Poblar caché en Redis para turnos subsiguientes
        await _conversationStore.SetCachedConsentAsync(tenantId, customerPhone, hasDbConsent, ct);

        return hasDbConsent;
    }

    public async Task RegisterConsentAsync(Guid tenantId, string customerPhone, string messageId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone) || tenantId == Guid.Empty)
        {
            return;
        }

        var cleanPhone = customerPhone.Replace("+", "").Trim();
        var evidence = JsonSerializer.Serialize(new
        {
            messageId,
            channel = "WHATSAPP",
            acceptedAtUtc = DateTime.UtcNow,
            legalBasis = "LOPDP_EC_ART_12_15"
        });

        var consent = new CustomerConsent
        {
            TenantId = tenantId,
            PhoneNumber = cleanPhone,
            Channel = "WHATSAPP",
            ConsentVersion = "1.0",
            AcceptedAt = DateTime.UtcNow,
            EvidencePayload = evidence,
            IsRevoked = false
        };

        _db.CustomerConsents.Add(consent);
        await _db.SaveChangesAsync(ct);

        // Actualizar caché en Redis inmediatamente
        await _conversationStore.SetCachedConsentAsync(tenantId, customerPhone, true, ct);

        _logger.LogInformation("Consentimiento LOPDP registrado exitosamente para {Phone} en Tenant {TenantId}", cleanPhone, tenantId);
    }

    public async Task RevokeConsentAsync(Guid tenantId, string customerPhone, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerPhone) || tenantId == Guid.Empty)
        {
            return;
        }

        var cleanPhone = customerPhone.Replace("+", "").Trim();
        var searchDigits = cleanPhone.Length >= 9 ? cleanPhone[^9..] : cleanPhone;

        var activeConsents = await _db.CustomerConsents
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == tenantId && c.PhoneNumber.Contains(searchDigits) && !c.IsRevoked)
            .ToListAsync(ct);

        foreach (var consent in activeConsents)
        {
            consent.IsRevoked = true;
            consent.RevokedAt = DateTime.UtcNow;
        }

        if (activeConsents.Count > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        // Marcar revocatoria en Redis para bloquear turnos posteriores inmediatamente
        await _conversationStore.RevokeCachedConsentAsync(tenantId, customerPhone, ct);

        _logger.LogInformation("Consentimiento LOPDP revocado para {Phone} en Tenant {TenantId}", cleanPhone, tenantId);
    }
}

