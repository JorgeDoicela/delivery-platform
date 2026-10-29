using Delivery.Core.Domain.Common;
using NetTopologySuite.Geometries;

namespace Delivery.Core.Domain.Entities;

public class Branch : IMustHaveTenant
{
    public int Id { get; set; }

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

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

    /// <summary>
    /// Código de establecimiento asignado por el SRI (ej. "001" Matriz Norte, "002" Sucursal Sur).
    /// </summary>
    public string SriEstablishmentCode { get; set; } = "001";

    /// <summary>
    /// Código de punto de emisión SRI (ej. "001").
    /// </summary>
    public string SriEmissionPoint { get; set; } = "001";

    /// <summary>
    /// Próximo secuencial de facturación electrónica para esta sucursal.
    /// </summary>
    public int NextInvoiceSequence { get; set; } = 1;

    public string OpeningTime { get; set; } = "10:30";
    public string ClosingTime { get; set; } = "21:30";

    public bool IsActive { get; set; } = true;

    // Navegación
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<BranchProduct> BranchProducts { get; set; } = new List<BranchProduct>();
}
