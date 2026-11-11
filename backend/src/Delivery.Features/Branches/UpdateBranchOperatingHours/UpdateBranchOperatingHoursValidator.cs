using FluentValidation;

namespace Delivery.Features.Branches.UpdateBranchOperatingHours;

public sealed class UpdateBranchOperatingHoursValidator : AbstractValidator<UpdateBranchOperatingHoursCommand>
{
    private const string TimePattern = @"^([01]\d|2[0-3]):[0-5]\d$";

    public UpdateBranchOperatingHoursValidator()
    {
        RuleFor(x => x.BranchId)
            .GreaterThan(0)
            .WithMessage("El identificador de la sucursal debe ser un número entero positivo.");

        RuleFor(x => x.OpeningTime)
            .NotEmpty()
            .WithMessage("La hora de apertura es obligatoria.")
            .Matches(TimePattern)
            .WithMessage("La hora de apertura debe tener formato HH:mm de 24 horas (ej. 10:30).");

        RuleFor(x => x.ClosingTime)
            .NotEmpty()
            .WithMessage("La hora de cierre es obligatoria.")
            .Matches(TimePattern)
            .WithMessage("La hora de cierre debe tener formato HH:mm de 24 horas (ej. 21:30).");

        RuleFor(x => x)
            .Must(x => !string.Equals(x.OpeningTime?.Trim(), x.ClosingTime?.Trim(), StringComparison.Ordinal))
            .When(x => !string.IsNullOrWhiteSpace(x.OpeningTime) && !string.IsNullOrWhiteSpace(x.ClosingTime))
            .WithMessage("La hora de cierre no puede ser idéntica a la hora de apertura.");

        RuleFor(x => x.DeliveryRadiusKm)
            .InclusiveBetween(0.5, 200.0)
            .When(x => x.DeliveryRadiusKm.HasValue)
            .WithMessage("El radio de cobertura debe estar comprendido entre 0.5 km y 200 km.");
    }
}
