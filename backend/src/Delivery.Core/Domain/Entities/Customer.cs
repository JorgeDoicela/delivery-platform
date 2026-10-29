using Delivery.Core.Domain.Common;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Domain.Entities;

/// <summary>
/// Directorio de clientes frecuentes y datos fiscales SRI para autocompletado instantáneo
/// en caja POS (por Cédula/RUC) y en pedidos telefónicos/web (por Teléfono).
/// </summary>
public class Customer : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string IdentificationType { get; set; } = "CEDULA"; // CEDULA, RUC, PASAPORTE, CONSUMIDOR_FINAL
    public string IdentificationNumber { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string? DefaultAddressStreet { get; set; }
    public string? DefaultAddressReference { get; set; }
    public Point? DefaultLocationPoint { get; set; }

    public int TotalOrdersCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastOrderAt { get; set; }

    // Navegación
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

