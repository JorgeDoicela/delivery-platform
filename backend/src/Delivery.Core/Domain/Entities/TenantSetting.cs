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
}

