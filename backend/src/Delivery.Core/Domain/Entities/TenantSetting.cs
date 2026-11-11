using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class TenantSetting : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string? CustomDomain { get; set; }
    public string CurrencyCode { get; set; } = "USD";
    public string SriEnvironment { get; set; } = "PRUEBAS";
    public string? SriCertificatePath { get; set; }
    public string? SriCertificatePasswordHash { get; set; }

    // Configuración Operativa y Financiera del Storefront
    public decimal BaseDeliveryFee { get; set; } = 1.50m;
    public bool EnableDelivery { get; set; } = true;
    public bool EnableTakeout { get; set; } = true;
    public bool EnableDineIn { get; set; }

    /// <summary>
    /// Habilita o deshabilita la validación estricta de cobertura geográfica (geocerca/radio).
    /// Si es falso, los clientes pueden pedir desde cualquier ubicación y se asigna la sucursal más cercana por Haversine.
    /// </summary>
    public bool RequireCoverageValidation { get; set; } = true;

    public bool AcceptsCash { get; set; } = true;
    public bool AcceptsBankTransfer { get; set; } = true;
    public bool AcceptsCard { get; set; }

    public string? BankName { get; set; }
    public string? BankAccountType { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountHolder { get; set; }
    public string? BankAccountTaxId { get; set; }

    // Personalización Dinámica de Landing Page (JSON y Plantillas)
    public string LandingLayoutTemplate { get; set; } = "asadero-clasico";
    public bool QuickLinksEnabled { get; set; } = true;
    public string HeroSlidesJson { get; set; } = "[]";
    public string PromotionalBannersJson { get; set; } = "[]";

    // Textos Legales y Políticas por Tenant
    public string? TermsAndConditionsMarkdown { get; set; }
    public string? PrivacyPolicyMarkdown { get; set; }

    // Configuración Asistente WhatsApp e Inteligencia Artificial
    /// <summary>
    /// Habilita o deshabilita la atención automatizada del bot conversacional de WhatsApp para este establecimiento.
    /// </summary>
    public bool EnableWhatsAppBot { get; set; } = true;

    /// <summary>
    /// Exige consentimiento previo auditable conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP).
    /// </summary>
    public bool RequireDataProtectionConsent { get; set; } = true;

    /// <summary>
    /// Enlace personalizado de la política de privacidad. Si es nulo, usa https://{PlatformDomain}/{slug}/privacidad.
    /// </summary>
    public string? CustomPrivacyPolicyUrl { get; set; }
}

