using System.Security.Cryptography;
using System.Text;
using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Http;
using Delivery.Features.Common.Security;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.VerifyEmail;

public sealed record VerifyEmailRequest(
    string Token,
    string? Email = null
);

public sealed record VerifyEmailResponse(
    bool Success,
    string Message,
    string? Email,
    string? FullName
);

public sealed class VerifyEmailValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("El token de verificación es obligatorio.")
            .Length(64).WithMessage("El token de verificación debe contener 64 caracteres hexadecimales.");

        When(x => !string.IsNullOrWhiteSpace(x.Email), () =>
        {
            RuleFor(x => x.Email!)
                .EmailAddress().WithMessage("El formato del correo electrónico es inválido.");
        });
    }
}

public sealed class VerifyEmailHandler : IHandler<VerifyEmailRequest, Result<VerifyEmailResponse>>
{
    private readonly AppDbContext _context;

    public VerifyEmailHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<VerifyEmailResponse>> Handle(VerifyEmailRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedToken = request.Token.Trim().ToLowerInvariant();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalizedToken))).ToLowerInvariant();

        var verificationToken = await _context.EmailVerificationTokens
            .IgnoreQueryFilters()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (verificationToken == null)
        {
            return Result.Failure<VerifyEmailResponse>(AuthErrors.InvalidOrExpiredVerificationToken);
        }

        if (verificationToken.UsedAt.HasValue || DateTime.UtcNow >= verificationToken.ExpiresAt)
        {
            return Result.Failure<VerifyEmailResponse>(AuthErrors.InvalidOrExpiredVerificationToken);
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailLower = request.Email.Trim().ToLowerInvariant();
            if (!verificationToken.User.Email.Equals(emailLower, StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure<VerifyEmailResponse>(AuthErrors.InvalidOrExpiredVerificationToken);
            }
        }

        // Marcar token como consumido y usuario como verificado
        verificationToken.UsedAt = DateTime.UtcNow;
        verificationToken.User.IsEmailVerified = true;
        verificationToken.User.EmailVerifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new VerifyEmailResponse(
            Success: true,
            Message: "Correo electrónico verificado exitosamente. Tu cuenta ahora se encuentra 100% activa para pedidos y notificaciones.",
            Email: verificationToken.User.Email,
            FullName: verificationToken.User.FullName
        ));
    }
}

public sealed class VerifyEmailEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/verify-email", async (
            [FromBody] VerifyEmailRequest request,
            [FromServices] IValidator<VerifyEmailRequest> validator,
            [FromServices] VerifyEmailHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.ToDictionary(e => e.PropertyName, e => new[] { e.ErrorMessage });
                return Results.ValidationProblem(errors);
            }

            var result = await handler.Handle(request, ct);
            return result.ToHttpResult();
        })
        .WithName("VerifyEmail")
        .WithTags("Auth")
        .WithSummary("Valida el token de verificación recibido por correo electrónico y activa la confirmación de cuenta.")
        .Produces<VerifyEmailResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest);

        app.MapPost("/api/auth/verify-email", async (
            [FromBody] VerifyEmailRequest request,
            [FromServices] IValidator<VerifyEmailRequest> validator,
            [FromServices] VerifyEmailHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.ToDictionary(e => e.PropertyName, e => new[] { e.ErrorMessage });
                return Results.ValidationProblem(errors);
            }

            var result = await handler.Handle(request, ct);
            return result.ToHttpResult();
        })
        .WithName("VerifyEmailLegacyAlias")
        .WithTags("Auth")
        .ExcludeFromDescription();
    }
}

