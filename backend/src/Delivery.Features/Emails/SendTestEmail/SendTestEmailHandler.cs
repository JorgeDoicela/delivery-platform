using Delivery.Core.Common;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Delivery.Features.Emails.SendTestEmail;

public sealed record SendTestEmailRequest(
    string RecipientEmail,
    string? RecipientName = null
);

public sealed record SendTestEmailResponse(
    bool Success,
    string Message,
    string SmtpHost,
    int SmtpPort,
    bool SslEnabled,
    DateTime SentAt
);

public sealed class SendTestEmailValidator : AbstractValidator<SendTestEmailRequest>
{
    public SendTestEmailValidator()
    {
        RuleFor(x => x.RecipientEmail)
            .NotEmpty().WithMessage("El correo electrónico del destinatario es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.");

        When(x => !string.IsNullOrEmpty(x.RecipientName), () =>
        {
            RuleFor(x => x.RecipientName).MaximumLength(120);
        });
    }
}

public sealed class SendTestEmailHandler : IHandler<SendTestEmailRequest, Result<SendTestEmailResponse>>
{
    private readonly IEmailService _emailService;
    private readonly SmtpOptions _smtpOptions;
    private readonly AppDbContext _context;
    private readonly IHostEnvironment _env;

    public SendTestEmailHandler(
        IEmailService emailService,
        IOptions<SmtpOptions> smtpOptions,
        AppDbContext context,
        IHostEnvironment env)
    {
        _emailService = emailService;
        _smtpOptions = smtpOptions.Value ?? new SmtpOptions();
        _context = context;
        _env = env;
    }

    public async Task<Result<SendTestEmailResponse>> Handle(SendTestEmailRequest request, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

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

        var model = new TestEmailModel
        {
            Brand = brand,
            SmtpHost = string.IsNullOrWhiteSpace(_smtpOptions.Host) ? "localhost (Modo Simulación)" : _smtpOptions.Host,
            SmtpPort = _smtpOptions.Port,
            SslEnabled = _smtpOptions.EnableSsl,
            SenderEmail = _smtpOptions.SenderEmail,
            SentAt = DateTime.UtcNow,
            EnvironmentName = _env.EnvironmentName
        };

        var sendResult = await _emailService.SendTemplatedEmailAsync(
            request.RecipientEmail,
            request.RecipientName ?? "Administrador",
            $"[Prueba SMTP] Diagnóstico de Correo - {brand.BrandName}",
            EmailTemplateType.TestEmail,
            model,
            tenant?.Id,
            cancellationToken
        );

        if (!sendResult.IsSuccess)
        {
            return Result.Failure<SendTestEmailResponse>(sendResult.Error);
        }

        return Result<SendTestEmailResponse>.Success(new SendTestEmailResponse(
            Success: true,
            Message: _smtpOptions.IsConfigured
                ? $"Correo de diagnóstico despachado exitosamente mediante SMTP hacia '{request.RecipientEmail}'."
                : $"Servidor SMTP en modo simulación de desarrollo. Correo registrado en logs estructurados para '{request.RecipientEmail}'.",
            SmtpHost: _smtpOptions.Host,
            SmtpPort: _smtpOptions.Port,
            SslEnabled: _smtpOptions.EnableSsl,
            SentAt: model.SentAt
        ));
    }
}

public sealed class SendTestEmailEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/emails/test", async (
            [FromBody] SendTestEmailRequest request,
            [FromServices] IValidator<SendTestEmailRequest> validator,
            [FromServices] SendTestEmailHandler handler,
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
                    title: "Fallo en diagnóstico SMTP",
                    detail: result.Error.Message
                );
        })
        .WithName("SendTestEmail")
        .WithTags("Emails")
        .WithSummary("Despacha un correo de prueba para validar la conectividad e infraestructura SMTP.")
        .Produces<SendTestEmailResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
