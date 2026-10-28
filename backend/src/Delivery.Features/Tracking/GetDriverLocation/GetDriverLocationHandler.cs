using System.Globalization;
using Delivery.Core.Common;
using Delivery.Features.Common.Handlers;
using FluentValidation;
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

public sealed class GetDriverLocationValidator : AbstractValidator<GetDriverLocationQuery>
{
    public GetDriverLocationValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("El identificador de la orden no puede ser un GUID vacío.");
    }
}

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

public sealed class GetDriverLocationHandler : IHandler<GetDriverLocationQuery, Result<DriverLocationResponse>>
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IValidator<GetDriverLocationQuery> _validator;

    public GetDriverLocationHandler(IConnectionMultiplexer redis, IValidator<GetDriverLocationQuery> validator)
    {
        _redis = redis;
        _validator = validator;
    }

    public async Task<Result<DriverLocationResponse>> Handle(GetDriverLocationQuery query, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<DriverLocationResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

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
