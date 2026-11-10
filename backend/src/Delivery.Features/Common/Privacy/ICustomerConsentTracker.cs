namespace Delivery.Features.Common.Privacy;

/// <summary>
/// Gestiona la verificación, registro auditable y revocatoria del consentimiento
/// para el tratamiento de datos personales conforme a la LOPDP.
/// </summary>
public interface ICustomerConsentTracker
{
    /// <summary>
    /// Verifica si el número telefónico cuenta con consentimiento activo para el establecimiento especificado.
    /// </summary>
    Task<bool> HasConsentAsync(Guid tenantId, string customerPhone, CancellationToken ct = default);

    /// <summary>
    /// Registra el consentimiento informado del comensal en base de datos y memoria caché.
    /// </summary>
    Task RegisterConsentAsync(Guid tenantId, string customerPhone, string messageId, CancellationToken ct = default);

    /// <summary>
    /// Revoca el consentimiento del comensal a petición expresa (derecho de revocatoria LOPDP).
    /// </summary>
    Task RevokeConsentAsync(Guid tenantId, string customerPhone, CancellationToken ct = default);
}

