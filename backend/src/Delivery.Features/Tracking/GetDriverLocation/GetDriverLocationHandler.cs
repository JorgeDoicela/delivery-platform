using System.Globalization;
using Delivery.Core.Common;
using StackExchange.Redis;

namespace Delivery.Features.Tracking.GetDriverLocation;

public sealed record GetDriverLocationQuery(Guid OrderId);

public sealed record DriverLocationResponse(
    string DriverId,
    double Latitude,
    double Longitude,
    double? Heading,
    DateTime Timestamp
);

public static class GetDriverLocationErrors
{
    public static readonly Error NoDriverAssigned = new(
        "Tracking.NoDriverAssigned",
        "Aún no hay un repartidor asignado a esta orden."
    );

    public static readonly Error LocationUnavailable = new(
        "Tracking.LocationUnavailable",
        "La ubicación GPS del repartidor no está disponible en este momento."
    );
}

public sealed class GetDriverLocationHandler
{
    private readonly IConnectionMultiplexer _redis;

    public GetDriverLocationHandler(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<Result<DriverLocationResponse>> Handle(GetDriverLocationQuery query, CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();

        // Obtener ID del repartidor asignado a la orden
        var driverIdVal = await db.StringGetAsync($"order:{query.OrderId}:driver");
        if (driverIdVal.IsNullOrEmpty)
        {
            return Result.Failure<DriverLocationResponse>(GetDriverLocationErrors.NoDriverAssigned);
        }

        string driverId = driverIdVal.ToString();

        // Obtener posición actual desde Redis GEO (retorna GeoPosition?)
        var pos = await db.GeoPositionAsync("active_drivers:locations", driverId);
        if (!pos.HasValue)
        {
            return Result.Failure<DriverLocationResponse>(GetDriverLocationErrors.LocationUnavailable);
        }

        // Obtener vector de dirección (heading)
        double? heading = null;
        var headingVal = await db.StringGetAsync($"driver:{driverId}:heading");
        if (!headingVal.IsNullOrEmpty && double.TryParse(headingVal.ToString(), CultureInfo.InvariantCulture, out var parsedHeading))
        {
            heading = parsedHeading;
        }

        return Result.Success(new DriverLocationResponse(
            driverId,
            pos.Value.Latitude,
            pos.Value.Longitude,
            heading,
            DateTime.UtcNow
        ));
    }
}
