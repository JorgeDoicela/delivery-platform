using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Drivers.UpdateDriverStatus;

public sealed record UpdateDriverStatusCommand(
    Guid UserId,
    bool IsAvailable,
    string? VehicleType = null,
    string? LicensePlate = null
);

public sealed record UpdateDriverStatusResponse(
    Guid DriverId,
    bool IsAvailable,
    string VehicleType,
    string? LicensePlate,
    DateTime UpdatedAt
);

public sealed class UpdateDriverStatusValidator : AbstractValidator<UpdateDriverStatusCommand>
{
    public UpdateDriverStatusValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("El identificador de usuario es requerido.");

        When(x => !string.IsNullOrEmpty(x.VehicleType), () =>
        {
            RuleFor(x => x.VehicleType).MaximumLength(50);
        });

        When(x => !string.IsNullOrEmpty(x.LicensePlate), () =>
        {
            RuleFor(x => x.LicensePlate).MaximumLength(20);
        });
    }
}

public static class UpdateDriverStatusErrors
{
    public static readonly Error DriverNotFound = new(
        "Drivers.NotFound",
        "No se encontró un perfil de repartidor activo para el usuario actual."
    );
}

public sealed class UpdateDriverStatusHandler : IHandler<UpdateDriverStatusCommand, Result<UpdateDriverStatusResponse>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<UpdateDriverStatusCommand> _validator;

    public UpdateDriverStatusHandler(
        AppDbContext context,
        IValidator<UpdateDriverStatusCommand> validator)
    {
        _context = context;
        _validator = validator;
    }

    public async Task<Result<UpdateDriverStatusResponse>> Handle(UpdateDriverStatusCommand command, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<UpdateDriverStatusResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var driver = await _context.Drivers
            .FirstOrDefaultAsync(d => d.UserId == command.UserId, cancellationToken);

        if (driver is null)
        {
            return Result.Failure<UpdateDriverStatusResponse>(UpdateDriverStatusErrors.DriverNotFound);
        }

        driver.IsAvailable = command.IsAvailable;

        if (!string.IsNullOrWhiteSpace(command.VehicleType))
        {
            driver.VehicleType = command.VehicleType.Trim().ToUpperInvariant();
        }

        if (command.LicensePlate is not null)
        {
            driver.LicensePlate = string.IsNullOrWhiteSpace(command.LicensePlate)
                ? null
                : command.LicensePlate.Trim().ToUpperInvariant();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new UpdateDriverStatusResponse(
            driver.Id,
            driver.IsAvailable,
            driver.VehicleType,
            driver.LicensePlate,
            DateTime.UtcNow
        ));
    }
}
