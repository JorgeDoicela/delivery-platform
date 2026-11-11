using Delivery.Core.Common;
using Delivery.Core.Common.Spatial;
using Delivery.Core.Domain.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Delivery.Features.Branches.ResolveBranch;

public sealed record ResolveBranchQuery(double Latitude, double Longitude);

public sealed record BranchCoverageDto(
    int BranchId,
    string BranchName,
    string Address,
    string Phone,
    int MaxOrdersPerSlot,
    bool IsActive,
    double DistanceKm = 0,
    bool IsDirectCoverage = true
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

public sealed class ResolveBranchValidator : AbstractValidator<ResolveBranchQuery>
{
    public ResolveBranchValidator()
    {
        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90.0, 90.0)
            .WithErrorCode(ResolveBranchErrors.InvalidCoordinates.Code)
            .WithMessage(ResolveBranchErrors.InvalidCoordinates.Message);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180.0, 180.0)
            .WithErrorCode(ResolveBranchErrors.InvalidCoordinates.Code)
            .WithMessage(ResolveBranchErrors.InvalidCoordinates.Message);
    }
}

public sealed class ResolveBranchHandler : IHandler<ResolveBranchQuery, Result<BranchCoverageDto>>
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private readonly AppDbContext _context;
    private readonly ITenantContext? _tenantContext;
    private readonly IValidator<ResolveBranchQuery> _validator;

    public ResolveBranchHandler(
        AppDbContext context,
        IValidator<ResolveBranchQuery> validator,
        ITenantContext? tenantContext = null)
    {
        _context = context;
        _validator = validator;
        _tenantContext = tenantContext;
    }

    public async Task<Result<BranchCoverageDto>> Handle(ResolveBranchQuery query, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<BranchCoverageDto>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        // En NetTopologySuite y GeoJSON las coordenadas son (Longitud, Latitud) -> (X, Y)
        var clientPoint = GeometryFactory.CreatePoint(new Coordinate(query.Longitude, query.Latitude));

        // Obtener configuración de cobertura del comercio actual
        var tenantSettings = await _context.TenantSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        var requireCoverageValidation = tenantSettings?.RequireCoverageValidation ?? true;

        // Cargar sucursales activas (el filtro global ITenantEntity aísla automáticamente por TenantId si está en contexto)
        var activeBranches = await _context.Branches
            .AsNoTracking()
            .Where(b => b.IsActive)
            .ToListAsync(cancellationToken);

        if (activeBranches.Count == 0)
        {
            return Result.Failure<BranchCoverageDto>(ResolveBranchErrors.OutsideCoverage);
        }

        // Evaluar sucursales mediante polígono PostGIS (ST_Contains) y distancia geodésica exacta con fórmula de Haversine
        var evaluatedBranches = activeBranches.Select(b =>
        {
            var branchLat = b.LocationPoint.Y;
            var branchLon = b.LocationPoint.X;
            var distanceKm = HaversineCalculator.CalculateDistanceKm(branchLat, branchLon, query.Latitude, query.Longitude);

            var insidePolygon = b.CoveragePolygon != null && b.CoveragePolygon.Contains(clientPoint);
            var insideRadius = b.DeliveryRadiusKm.HasValue && b.DeliveryRadiusKm.Value > 0
                ? distanceKm <= b.DeliveryRadiusKm.Value
                : false;

            var hasDirectCoverage = insidePolygon || insideRadius;

            return new
            {
                Branch = b,
                DistanceKm = Math.Round(distanceKm, 2),
                HasDirectCoverage = hasDirectCoverage
            };
        }).ToList();

        // 1. Priorizar sucursales con cobertura directa (polígono PostGIS o radio Haversine), seleccionando la más cercana
        var directMatch = evaluatedBranches
            .Where(x => x.HasDirectCoverage)
            .OrderBy(x => x.DistanceKm)
            .FirstOrDefault();

        if (directMatch != null)
        {
            var b = directMatch.Branch;
            return Result.Success(new BranchCoverageDto(
                b.Id,
                b.Name,
                b.Address,
                b.Phone,
                b.MaxOrdersPerSlot,
                b.IsActive,
                directMatch.DistanceKm,
                IsDirectCoverage: true
            ));
        }

        // 2. Cobertura flexible: si el tenant tiene la validación estricta desactivada o la sucursal es flexible
        var flexibleBranch = evaluatedBranches
            .Where(x => !requireCoverageValidation || !x.Branch.IsCoverageStrict)
            .OrderBy(x => x.DistanceKm)
            .FirstOrDefault();

        if (flexibleBranch != null)
        {
            var b = flexibleBranch.Branch;
            return Result.Success(new BranchCoverageDto(
                b.Id,
                b.Name,
                b.Address,
                b.Phone,
                b.MaxOrdersPerSlot,
                b.IsActive,
                flexibleBranch.DistanceKm,
                IsDirectCoverage: false
            ));
        }

        return Result.Failure<BranchCoverageDto>(ResolveBranchErrors.OutsideCoverage);
    }
}
