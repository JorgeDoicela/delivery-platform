using FluentValidation;

namespace Delivery.Features.Auth.GoogleAuth;

public class GoogleAuthValidator : AbstractValidator<GoogleAuthCommand>
{
    public GoogleAuthValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty().WithMessage("El token de Google (ID Token) es obligatorio.")
            .MinimumLength(10).WithMessage("El token de Google tiene un formato inválido.");
    }
}

