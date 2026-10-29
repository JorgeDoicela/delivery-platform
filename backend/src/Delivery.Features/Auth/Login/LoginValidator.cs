using FluentValidation;

namespace Delivery.Features.Auth.Login;

public class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electronico es requerido.")
            .EmailAddress().WithMessage("El formato del correo electronico es invalido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contrasena es requerida.")
            .MinimumLength(6).WithMessage("La contrasena debe contener al menos 6 caracteres.");
    }
}

