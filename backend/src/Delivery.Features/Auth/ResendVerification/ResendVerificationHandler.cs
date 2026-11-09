using System.Security.Cryptography;
using System.Text;
using Delivery.Core.Common;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Http;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.ResendVerification;

public sealed record ResendVerificationRequest(
    string Email,
    string? TenantSlug = null
);

public sealed record ResendVerificationResponse(
    string Message
);

public sealed class ResendVerificationValidator : AbstractValidator<ResendVerificationRequest>
{
    public ResendVerificationValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.")
            .MaximumLength(150).WithMessage("El correo no puede exceder los 150 caracteres.");
    }
}

public sealed class ResendVerificationHandler : IHandler<ResendVerificationRequest, Result<ResendVerificationResponse>>
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IBackgroundEmailQueue _emailQueue;

    public ResendVerificationHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IBackgroundEmailQueue emailQueue)
    {
        _context = context;
        _tenantContext = tenantContext;
        _emailQueue = emailQueue;
    }

    public async Task<Result<ResendVerificationResponse>> Handle(ResendVerificationRequest request, CancellationToken cancellationToken = default)
    {
        var genericMessage = "Si el correo electrónico corresponde a una cuenta registrada pendiente de activación, recibirás un nuevo enlace de verificación en breve.";

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

        // 2. Búsqueda de usuario con protección anti-enumeración
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
            return Result.Success(new ResendVerificationResponse(genericMessage));
        }

        if (user.IsEmailVerified)
        {
            return Result.Success(new ResendVerificationResponse("Tu correo electrónico ya se encuentra verificado previamente en el sistema."));
        }

        // 3. Invalidar tokens previos pendientes
        var oldTokens = await _context.EmailVerificationTokens
            .IgnoreQueryFilters()
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var old in oldTokens)
        {
            old.UsedAt = DateTime.UtcNow;
        }

        // 4. Generar nuevo token criptográfico
        var rawTokenBytes = RandomNumberGenerator.GetBytes(32);
        var rawToken = Convert.ToHexString(rawTokenBytes).ToLowerInvariant();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

        var newToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };

        await _context.EmailVerificationTokens.AddAsync(newToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Preparar contexto de marca y despachar correo
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
        var verificationUrl = $"https://mesafy.doicela.dev/{targetSlug}/login?tab=verify-email&token={rawToken}&email={Uri.EscapeDataString(user.Email)}";

        var emailModel = new EmailVerificationEmailModel
        {
            Brand = brand,
            UserName = string.IsNullOrWhiteSpace(user.FullName) ? "Estimado/a cliente" : user.FullName,
            UserEmail = user.Email,
            VerificationUrl = verificationUrl,
            VerificationToken = rawToken,
            ExpirationMinutes = 1440
        };

        _emailQueue.EnqueueTemplatedEmail(
            user.Email,
            user.FullName,
            $"Verifica tu correo electrónico - {brand.BrandName}",
            EmailTemplateType.EmailVerification,
            emailModel,
            tenant?.Id
        );

        return Result.Success(new ResendVerificationResponse(genericMessage));
    }
}

public sealed class ResendVerificationEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/resend-verification", async (
            [FromBody] ResendVerificationRequest request,
            [FromServices] IValidator<ResendVerificationRequest> validator,
            [FromServices] ResendVerificationHandler handler,
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
        .WithName("ResendVerification")
        .WithTags("Auth")
        .WithSummary("Reenvía un enlace de verificación al correo electrónico registrado.")
        .Produces<ResendVerificationResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest);

        app.MapPost("/api/auth/resend-verification", async (
            [FromBody] ResendVerificationRequest request,
            [FromServices] IValidator<ResendVerificationRequest> validator,
            [FromServices] ResendVerificationHandler handler,
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
        .WithName("ResendVerificationLegacyAlias")
        .WithTags("Auth")
        .ExcludeFromDescription();
    }
}

