using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

/// <summary>
/// Registro legal y auditable de consentimiento informado para el tratamiento de datos personales
/// conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador y estándares internacionales.
/// </summary>
public class CustomerConsent : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    /// <summary>
    /// Número de teléfono del comensal en formato internacional E.164 (ej. 593987654321).
    /// </summary>
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// Canal de origen por el cual se otorgó el consentimiento (ej. "WHATSAPP", "WEB_STOREFRONT").
    /// </summary>
    public string Channel { get; set; } = "WHATSAPP";

    /// <summary>
    /// Versión de la política de privacidad aceptada (ej. "1.0"). Permite solicitar nuevo consentimiento ante reformas.
    /// </summary>
    public string ConsentVersion { get; set; } = "1.0";

    /// <summary>
    /// Fecha y hora UTC del otorgamiento del consentimiento.
    /// </summary>
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Evidencia técnica del consentimiento (ej. ID de mensaje wamid, IP o metadatos de la interacción).
    /// </summary>
    public string? EvidencePayload { get; set; }

    /// <summary>
    /// Indica si el comensal ejerció su derecho a la revocatoria del consentimiento.
    /// </summary>
    public bool IsRevoked { get; set; }

    /// <summary>
    /// Fecha y hora UTC de la revocatoria, si fue solicitada por el titular de los datos.
    /// </summary>
    public DateTime? RevokedAt { get; set; }
}

