using FluentValidation;

namespace Delivery.Features.Tenants.CreateTenant;

public sealed class CreateTenantValidator : AbstractValidator<CreateTenantCommand>
{
    public CreateTenantValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre comercial es obligatorio.")
            .MaximumLength(120);

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("El identificador de URL (slug) es obligatorio.")
            .MaximumLength(60)
            .Matches("^[a-z0-9-]+$").WithMessage("El slug solo puede contener letras minúsculas, números y guiones.");

        RuleFor(x => x.BusinessName)
            .NotEmpty().WithMessage("La razón social es obligatoria.")
            .MaximumLength(150);

        RuleFor(x => x.TaxId)
            .NotEmpty().WithMessage("El RUC o identificación tributaria es obligatorio.")
            .MaximumLength(30);

        RuleFor(x => x.BrandPrimaryColor)
            .NotEmpty()
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("El color primario debe estar en formato hexadecimal (#RRGGBB).");

        RuleFor(x => x.BaseDeliveryFee)
            .GreaterThanOrEqualTo(0m)
            .LessThanOrEqualTo(25m);

        RuleFor(x => x.PrimaryBranchName)
            .NotEmpty().WithMessage("El nombre de la sucursal matriz es obligatorio.")
            .MaximumLength(120);

        RuleFor(x => x.PrimaryBranchAddress)
            .NotEmpty().WithMessage("La dirección de la sucursal matriz es obligatoria.")
            .MaximumLength(250);

        RuleFor(x => x.AdminFullName)
            .NotEmpty().WithMessage("El nombre del administrador del comercio es obligatorio.")
            .MaximumLength(120);

        RuleFor(x => x.AdminEmail)
            .NotEmpty().WithMessage("El correo del administrador es obligatorio.")
            .EmailAddress().WithMessage("El correo del administrador no tiene un formato válido.");

        RuleFor(x => x.AdminPassword)
            .NotEmpty().WithMessage("La contraseña inicial es obligatoria.")
            .MinimumLength(6).WithMessage("La contraseña debe tener al menos 6 caracteres.");
    }
}

