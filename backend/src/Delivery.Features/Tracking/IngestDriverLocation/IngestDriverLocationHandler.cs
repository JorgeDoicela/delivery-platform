using System.Globalization;
using Delivery.Core.Common;
using StackExchange.Redis;

namespace Delivery.Features.Tracking.IngestDriverLocation;

public sealed record IngestDriverLocationCommand(
    string DriverId,
    Guid OrderId,
    double Latitude,
    double Longitude,
    double? Heading
);

public sealed record IngestDriverLocationResponse(
    string DriverId,
    Guid OrderId,
    double Latitude,
    double Longitude,
    double? Heading,
    DateTime RecordedAt
);

public sealed class IngestDriverLocationHandler
{
    private readonly IConnectionMultiplexer _redis;

    public IngestDriverLocationHandler(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<Result<IngestDriverLocationResponse>> Handle(IngestDriverLocationCommand command, CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();

        // 1. Ingesta geoespacial de alta velocidad en Redis GEO (Lng, Lat, MemberId)
        await db.GeoAddAsync(
            "active_drivers:locations",
            command.Longitude,
            command.Latitude,
            command.DriverId
        );

        // 2. Almacenamiento del rumbo (heading) con expiración corta (TTL: 60 segundos)
        if (command.Heading.HasValue)
        {
            await db.StringSetAsync(
                $"driver:{command.DriverId}:heading",
                command.Heading.Value.ToString(CultureInfo.InvariantCulture),
                TimeSpan.FromSeconds(60)
            );
        }

        // 3. Mapeo rápido de orden a conductor
        await db.StringSetAsync(
            $"order:{command.OrderId}:driver",
            command.DriverId,
            TimeSpan.FromHours(2)
        );

        return Result.Success(new IngestDriverLocationResponse(
            command.DriverId,
            command.OrderId,
            command.Latitude,
            command.Longitude,
            command.Heading,
            DateTime.UtcNow
        ));
    }
}
