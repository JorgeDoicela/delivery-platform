using Delivery.Core.Domain.Entities;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public class TenantChatContext
{
    public Tenant Tenant { get; set; } = null!;
    public List<Branch> Branches { get; set; } = new();
    public List<Product> Products { get; set; } = new();
    public string SystemPrompt { get; set; } = string.Empty;
}

public interface ITenantKnowledgeProvider
{
    Task<TenantChatContext> ResolveContextAsync(
        string phoneNumberId,
        string? userMessage = null,
        string? customerPhone = null,
        Guid? currentSessionTenantId = null,
        CancellationToken ct = default);

    Task<string?> TryResolveOrderStatusAsync(Guid tenantId, string customerPhone, string userMessage, CancellationToken ct = default);
}

