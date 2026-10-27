using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Delivery.Features.Geofencing.ResolveBranchByPoint;

public sealed record ResolveBranchQuery(double Latitude, double Longitude);

public sealed record BranchCoverageDto(
    int BranchId,
    string BranchName,
    string Address,
    string Phone,
    int MaxOrdersPerSlot,
    bool IsActive
);

public static class ResolveBranchErrors
{
    public static readonly Error OutsideCoverage = new(
        "Geofencing.OutsideCoverage",
        "La ubicación indicada se encuentra fuera de nuestra zona de cobertura de entrega a domicilio."
    );

    public static readonly Error InvalidCoordinates = new(
        "Geofencing.InvalidCoordinates",
        "Las coordenadas geográficas proporcionadas son inválidas."
    );
}

public sealed class ResolveBranchHandler
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private readonly AppDbContext _context;

    public ResolveBranchHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<BranchCoverageDto>> Handle(ResolveBranchQuery query, CancellationToken cancellationToken = default)
    {
        if (query.Latitude is < -90 or > 90 || query.Longitude is < -180 or > 180)
        {
            return Result.Failure<BranchCoverageDto>(ResolveBranchErrors.InvalidCoordinates);
        }

        // En NetTopologySuite y GeoJSON las coordenadas son (Longitud, Latitud) -> (X, Y)
        var clientPoint = GeometryFactory.CreatePoint(new Coordinate(query.Longitude, query.Latitude));

        // Consulta espacial evaluada con el índice GiST idx_branches_coverage_polygon en PostgreSQL
        var branch = await _context.Branches
            .AsNoTracking()
            .Where(b => b.IsActive && b.CoveragePolygon.Contains(clientPoint))
            .Select(b => new BranchCoverageDto(
                b.Id,
                b.Name,
                b.Address,
                b.Phone,
                b.MaxOrdersPerSlot,
                b.IsActive
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (branch is null)
        {
            return Result.Failure<BranchCoverageDto>(ResolveBranchErrors.OutsideCoverage);
        }

        return Result.Success(branch);
    }
}
