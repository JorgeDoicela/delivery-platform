using Delivery.Core.Domain.Common;

namespace Delivery.Core.Domain.Entities;

public class Invoice : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    /// <summary>
    /// Número secuencial SRI en formato 001-001-000000123.
    /// </summary>
    public string SequentialNumber { get; set; } = string.Empty;

    /// <summary>
    /// Clave de acceso de 49 dígitos generada conforme a la ficha técnica del SRI.
    /// </summary>
    public string SriAccessKey { get; set; } = string.Empty;

    /// <summary>
    /// Estado ante el SRI: "PENDIENTE", "AUTORIZADO", "RECHAZADO", "ANULADO".
    /// </summary>
    public string SriStatus { get; set; } = "PENDIENTE";

    public string BuyerIdentificationType { get; set; } = "CONSUMIDOR_FINAL";
    public string BuyerIdentificationNumber { get; set; } = "9999999999999";
    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerEmail { get; set; }

    public decimal SubtotalZeroTax { get; set; }
    public decimal SubtotalTaxable { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AuthorizedAt { get; set; }
    public string? SriErrorMessage { get; set; }
}

