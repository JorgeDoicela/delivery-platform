namespace Delivery.Core.Domain.Common;

/// <summary>
/// Contexto de resolución del inquilino (Tenant) para la solicitud en curso.
/// </summary>
public interface ITenantContext
{
    Guid? TenantId { get; }
    string? TenantSlug { get; }
    bool IsResolved { get; }
}

