using System.Security.Cryptography;
using System.Text;
using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.ResetPassword;

public sealed record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword,
    string? TenantSlug = null
);

public sealed record ResetPasswordResponse(
    bool Success,
    string Message
);

public sealed class ResetPasswordValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("El token de restablecimiento es obligatorio.")
            .MinimumLength(8).WithMessage("El token de restablecimiento no es válido.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("La nueva contraseña es obligatoria.")
            .MinimumLength(6).WithMessage("La nueva contraseña debe tener al menos 6 caracteres.")
            .MaximumLength(100).WithMessage("La contraseña no puede exceder los 100 caracteres.");
    }
}

public sealed class ResetPasswordHandler : IHandler<ResetPasswordRequest, Result<ResetPasswordResponse>>
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordHandler(
        AppDbContext context,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<ResetPasswordResponse>> Handle(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();
        var normalizedToken = request.Token.Trim().ToLowerInvariant();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalizedToken))).ToLowerInvariant();

        // 1. Búsqueda del usuario por correo electrónico
#pragma warning disable CA1862, CA1304, CA1311
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower, cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

        if (user == null || !user.IsActive)
        {
            return Result.Failure<ResetPasswordResponse>(AuthErrors.InvalidOrExpiredResetToken);
        }

        // 2. Búsqueda y validación del token de recuperación
        var resetToken = await _context.PasswordResetTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t =>
                t.UserId == user.Id &&
                t.TokenHash == tokenHash &&
                t.UsedAt == null &&
                t.ExpiresAt > DateTime.UtcNow,
                cancellationToken
            );

        if (resetToken == null)
        {
            return Result.Failure<ResetPasswordResponse>(AuthErrors.InvalidOrExpiredResetToken);
        }

        // 3. Cifrado y actualización de la nueva contraseña con BCrypt
        var newPasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.PasswordHash = newPasswordHash;

        // 4. Marcar token como consumido de forma irreversible
        resetToken.UsedAt = DateTime.UtcNow;

        // 5. Revocar sesiones y tokens de refresco activos previos por seguridad
        var activeRefreshTokens = await _context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(r => r.UserId == user.Id && r.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var rt in activeRefreshTokens)
        {
            rt.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new ResetPasswordResponse(
            Success: true,
            Message: "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."
        ));
    }
}

public sealed class ResetPasswordEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/reset-password", async (
            [FromBody] ResetPasswordRequest request,
            [FromServices] IValidator<ResetPasswordRequest> validator,
            [FromServices] ResetPasswordHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                return Results.ValidationProblem(validation.ToDictionary());
            }

            var result = await handler.Handle(request, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Fallo en restablecimiento de contraseña",
                    detail: result.Error.Message
                );
        })
        .WithName("ResetPassword")
        .WithTags("Auth")
        .WithSummary("Valida el token de seguridad y actualiza la contraseña del usuario.")
        .Produces<ResetPasswordResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesValidationProblem()
        .AllowAnonymous();

        // Alias canónico /api/auth/reset-password
        app.MapPost("/api/auth/reset-password", async (
            [FromBody] ResetPasswordRequest request,
            [FromServices] IValidator<ResetPasswordRequest> validator,
            [FromServices] ResetPasswordHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                return Results.ValidationProblem(validation.ToDictionary());
            }

            var result = await handler.Handle(request, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Fallo en restablecimiento de contraseña",
                    detail: result.Error.Message
                );
        })
        .ExcludeFromDescription()
        .AllowAnonymous();
    }
}
