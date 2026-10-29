namespace Delivery.Core.Domain.Common;

/// <summary>
/// Contrato para entidades aisladas estrictamente por discriminador de tenant en persistencia.
/// </summary>
public interface IMustHaveTenant
{
    Guid TenantId { get; set; }
}

