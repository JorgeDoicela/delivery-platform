using NetTopologySuite.Geometries;

namespace Delivery.Core.Domain.Entities;

public class Branch
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// Ubicación física de la sucursal (Longitud, Latitud) en SRID 4326.
    /// </summary>
    public Point LocationPoint { get; set; } = null!;

    /// <summary>
    /// Polígono geométrico que delimita la cobertura exacta de reparto (SRID 4326).
    /// Evaluado mediante ST_Contains con índice GiST.
    /// </summary>
    public Polygon CoveragePolygon { get; set; } = null!;

    /// <summary>
    /// Capacidad operativa máxima de pedidos admitidos por ventana de 20 minutos (throttling).
    /// </summary>
    public int MaxOrdersPerSlot { get; set; } = 15;

    public bool IsActive { get; set; } = true;

    // Navegación
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
