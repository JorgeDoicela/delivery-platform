using Delivery.Core.Domain.Common;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Domain.Entities;

public class Driver : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string VehicleType { get; set; } = "MOTO";
    public string? LicensePlate { get; set; }
    public bool IsAvailable { get; set; } = true;
    public Point? CurrentLocation { get; set; }

    // Navegación
    public ICollection<OrderDelivery> Deliveries { get; set; } = new List<OrderDelivery>();
}

