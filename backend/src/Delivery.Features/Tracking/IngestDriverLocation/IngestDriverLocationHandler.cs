using System.Globalization;
using Delivery.Core.Common;
using Delivery.Core.Contracts.Realtime;
using Delivery.Features.Common.Handlers;
using FluentValidation;
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

public sealed class IngestDriverLocationValidator : AbstractValidator<IngestDriverLocationCommand>
{
    public IngestDriverLocationValidator()
    {
        RuleFor(x => x.DriverId)
            .NotEmpty()
            .MaximumLength(100)
            .WithMessage("El identificador del repartidor es requerido.");

        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("El identificador de la orden no puede ser vacío.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90.0, 90.0)
            .WithMessage("La latitud debe estar comprendida entre -90 y 90 grados.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180.0, 180.0)
            .WithMessage("La longitud debe estar comprendida entre -180 y 180 grados.");

        When(x => x.Heading.HasValue, () =>
        {
            RuleFor(x => x.Heading!.Value)
                .InclusiveBetween(0.0, 360.0)
                .WithMessage("El rumbo (heading) debe estar entre 0 y 360 grados.");
        });
    }
}

public sealed class IngestDriverLocationHandler : IHandler<IngestDriverLocationCommand, Result<IngestDriverLocationResponse>>
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IValidator<IngestDriverLocationCommand> _validator;
    private readonly ITrackingNotifier _trackingNotifier;

    public IngestDriverLocationHandler(
        IConnectionMultiplexer redis,
        IValidator<IngestDriverLocationCommand> validator,
        ITrackingNotifier trackingNotifier)
    {
        _redis = redis;
        _validator = validator;
        _trackingNotifier = trackingNotifier;
    }

    public async Task<Result<IngestDriverLocationResponse>> Handle(IngestDriverLocationCommand command, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<IngestDriverLocationResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

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

        // 4. Transmisión reactiva en tiempo real al cliente suscriptor de la orden
        await _trackingNotifier.NotifyDriverLocationAsync(
            command.OrderId,
            command.Latitude,
            command.Longitude,
            command.Heading,
            cancellationToken
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
