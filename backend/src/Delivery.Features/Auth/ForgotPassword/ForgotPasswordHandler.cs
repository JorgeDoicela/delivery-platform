using System.Security.Cryptography;
using Delivery.Core.Common;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.ForgotPassword;

public sealed record ForgotPasswordRequest(
    string Email,
    string? TenantSlug = null
);

public sealed record ForgotPasswordResponse(
    string Message
);

public sealed class ForgotPasswordValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.")
            .MaximumLength(150).WithMessage("El correo no puede exceder los 150 caracteres.");
    }
}

public sealed class ForgotPasswordHandler : IHandler<ForgotPasswordRequest, Result<ForgotPasswordResponse>>
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IBackgroundEmailQueue _emailQueue;

    public ForgotPasswordHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IBackgroundEmailQueue emailQueue)
    {
        _context = context;
        _tenantContext = tenantContext;
        _emailQueue = emailQueue;
    }

    public async Task<Result<ForgotPasswordResponse>> Handle(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var genericMessage = "Si el correo electrónico se encuentra registrado en el sistema, recibirás las instrucciones de recuperación en tu bandeja de entrada en breve.";

        var emailLower = request.Email.Trim().ToLowerInvariant();

        // 1. Resolución del Tenant
        Tenant? tenant = null;
        if (!string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            var requestedSlug = request.TenantSlug.Trim().ToLowerInvariant();
            tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == requestedSlug, cancellationToken);
        }
        else if (_tenantContext.TenantId.HasValue)
        {
            tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId.Value, cancellationToken);
        }
        else
        {
            tenant = await _context.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == "la-granjita", cancellationToken)
                ?? await _context.Tenants
                    .IgnoreQueryFilters()
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.Id)
                    .FirstOrDefaultAsync(cancellationToken);
        }

        // 2. Búsqueda de usuario (protección anti-enumeración de usuarios)
#pragma warning disable CA1862, CA1304, CA1311
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u =>
                (tenant == null || u.TenantId == tenant.Id || u.TenantId == null) &&
                u.Email.ToLower() == emailLower,
                cancellationToken
            );
#pragma warning restore CA1862, CA1304, CA1311

        if (user == null || !user.IsActive)
        {
            // Retorno exitoso sin filtrar existencia
            return Result.Success(new ForgotPasswordResponse(genericMessage));
        }

        // 3. Generación criptográfica del token de restablecimiento
        var rawTokenBytes = RandomNumberGenerator.GetBytes(32);
        var rawToken = Convert.ToHexString(rawTokenBytes).ToLowerInvariant();
        var tokenHash = Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        // 4. Invalidar tokens anteriores pendientes del mismo usuario
        var oldTokens = await _context.PasswordResetTokens
            .IgnoreQueryFilters()
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var old in oldTokens)
        {
            old.UsedAt = DateTime.UtcNow;
        }

        // 5. Persistir nuevo token con validez de 30 minutos
        var resetToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            CreatedAt = DateTime.UtcNow
        };

        await _context.PasswordResetTokens.AddAsync(resetToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 6. Preparar contexto de marca y despacho por correo electrónico
        var brand = tenant != null
            ? new BrandEmailContext
            {
                BrandName = tenant.Name,
                BrandTagline = tenant.Tagline,
                PrimaryColor = tenant.BrandPrimaryColor ?? "#E4002B",
                LogoUrl = tenant.LogoUrl,
                SupportEmail = tenant.ContactEmail,
                SupportPhone = tenant.ContactPhone
            }
            : BrandEmailContext.DefaultPlatform;

        var targetSlug = tenant?.Slug ?? "la-granjita";
        var resetUrl = $"https://mesafy.doicela.dev/{targetSlug}/login?tab=reset-password&token={rawToken}&email={Uri.EscapeDataString(user.Email)}";

        var emailModel = new PasswordResetEmailModel
        {
            Brand = brand,
            UserName = string.IsNullOrWhiteSpace(user.FullName) ? "Estimado/a cliente" : user.FullName,
            ResetUrl = resetUrl,
            ResetToken = rawToken,
            ExpirationMinutes = 30
        };

        _emailQueue.EnqueueTemplatedEmail(
            user.Email,
            user.FullName,
            $"Restablece tu contraseña - {brand.BrandName}",
            EmailTemplateType.PasswordReset,
            emailModel,
            tenant?.Id
        );

        return Result.Success(new ForgotPasswordResponse(genericMessage));
    }
}

public sealed class ForgotPasswordEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/forgot-password", async (
            [FromBody] ForgotPasswordRequest request,
            [FromServices] IValidator<ForgotPasswordRequest> validator,
            [FromServices] ForgotPasswordHandler handler,
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
                    title: "Fallo en solicitud de recuperación",
                    detail: result.Error.Message
                );
        })
        .WithName("ForgotPassword")
        .WithTags("Auth")
        .WithSummary("Solicita un correo electrónico con enlace y token seguro para restablecer la contraseña.")
        .Produces<ForgotPasswordResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem()
        .AllowAnonymous();

        // Alias canónico /api/auth/forgot-password
        app.MapPost("/api/auth/forgot-password", async (
            [FromBody] ForgotPasswordRequest request,
            [FromServices] IValidator<ForgotPasswordRequest> validator,
            [FromServices] ForgotPasswordHandler handler,
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
                    title: "Fallo en solicitud de recuperación",
                    detail: result.Error.Message
                );
        })
        .ExcludeFromDescription()
        .AllowAnonymous();
    }
}
