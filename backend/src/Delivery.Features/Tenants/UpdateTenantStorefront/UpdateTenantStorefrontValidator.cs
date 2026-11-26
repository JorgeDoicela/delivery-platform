using FluentValidation;

namespace Delivery.Features.Tenants.UpdateTenantStorefront;

public sealed class UpdateTenantStorefrontValidator : AbstractValidator<UpdateTenantStorefrontCommand>
{
    public UpdateTenantStorefrontValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre comercial del negocio es obligatorio.")
            .MaximumLength(150);

        RuleFor(x => x.Tagline)
            .NotEmpty().WithMessage("El subtítulo de marca (Tagline) es obligatorio.")
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("La descripción institucional es obligatoria.")
            .MaximumLength(500);

        RuleFor(x => x.BrandPrimaryColor)
            .NotEmpty().WithMessage("El color primario es obligatorio.")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("El color primario debe tener formato hexadecimal válido (ej. #E4002B).");

        RuleFor(x => x.BrandPrimaryHoverColor)
            .NotEmpty().WithMessage("El color hover es obligatorio.")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("El color hover debe tener formato hexadecimal válido.");

        RuleFor(x => x.BrandAccentColor)
            .NotEmpty().WithMessage("El color de acento es obligatorio.")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("El color de acento debe tener formato hexadecimal válido.");

        RuleFor(x => x.BaseDeliveryFee)
            .GreaterThanOrEqualTo(0m)
            .WithMessage("La tarifa base de envío no puede ser negativa.");

        RuleFor(x => x.BaseDeliveryDistanceKm)
            .GreaterThanOrEqualTo(0.0)
            .When(x => x.BaseDeliveryDistanceKm.HasValue)
            .WithMessage("Los kilómetros incluidos en la tarifa base no pueden ser negativos.");

        RuleFor(x => x.ExtraDeliveryFeePerKm)
            .GreaterThanOrEqualTo(0m)
            .When(x => x.ExtraDeliveryFeePerKm.HasValue)
            .WithMessage("El costo adicional por kilómetro no puede ser negativo.");

        RuleFor(x => x.MaxDeliveryFee)
            .GreaterThanOrEqualTo(x => x.BaseDeliveryFee)
            .When(x => x.MaxDeliveryFee.HasValue && x.MaxDeliveryFee.Value > 0m)
            .WithMessage("El tope máximo de envío debe ser mayor o igual a la tarifa base.");

        RuleFor(x => x.FreeDeliveryMinOrderAmount)
            .GreaterThanOrEqualTo(0m)
            .When(x => x.FreeDeliveryMinOrderAmount.HasValue)
            .WithMessage("El monto mínimo para envío gratis no puede ser negativo.");

        RuleFor(x => x.CustomDomain)
            .Matches(@"^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?$")
            .When(x => !string.IsNullOrWhiteSpace(x.CustomDomain))
            .WithMessage("El formato del dominio personalizado no es válido (ej. pedidos.elrestaurante.com).");
    }
}

