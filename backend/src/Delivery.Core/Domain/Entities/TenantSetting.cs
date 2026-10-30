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

    public bool AcceptsCash { get; set; } = true;
    public bool AcceptsBankTransfer { get; set; } = true;
    public bool AcceptsCard { get; set; }

    public string? BankName { get; set; }
    public string? BankAccountType { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountHolder { get; set; }
    public string? BankAccountTaxId { get; set; }

    // Personalización Dinámica de Landing Page (JSON)
    public bool QuickLinksEnabled { get; set; } = true;
    public string HeroSlidesJson { get; set; } = "[]";
    public string PromotionalBannersJson { get; set; } = "[]";
}

