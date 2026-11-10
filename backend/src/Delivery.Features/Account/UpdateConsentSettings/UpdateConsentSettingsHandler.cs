using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Http;
using Delivery.Features.Common.Privacy;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Delivery.Features.Account.UpdateConsentSettings;

public sealed record UpdateConsentSettingsRequest(bool WhatsAppConsent);

public sealed record UpdateConsentSettingsCommand(
    Guid UserId,
    bool WhatsAppConsent,
    string? IpAddress,
    string? UserAgent
);

public sealed class UpdateConsentSettingsHandler : IHandler<UpdateConsentSettingsCommand, Result<bool>>
{
    private readonly AppDbContext _context;
    private readonly ICustomerConsentTracker _consentTracker;

    public UpdateConsentSettingsHandler(AppDbContext context, ICustomerConsentTracker consentTracker)
    {
        _context = context;
        _consentTracker = consentTracker;
    }

    public async Task<Result<bool>> Handle(UpdateConsentSettingsCommand request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<bool>(AccountErrors.UserNotFound);
        }

        if (string.IsNullOrWhiteSpace(user.Phone))
        {
            return Result.Failure<bool>(new Error("Account.PhoneRequired", "Debes registrar un número de teléfono en tu perfil para habilitar el canal de WhatsApp."));
        }

        var tenantId = _context.CurrentTenantId ?? user.TenantId;
        if (!tenantId.HasValue)
        {
            var fallbackTenant = await _context.Tenants.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            tenantId = fallbackTenant?.Id;
        }

        if (tenantId.HasValue)
        {
            if (request.WhatsAppConsent)
            {
                await _consentTracker.RegisterConsentAsync(
                    tenantId.Value,
                    user.Phone,
                    $"portal-{Guid.NewGuid():N}",
                    cancellationToken
                );
            }
            else
            {
                await _consentTracker.RevokeConsentAsync(
                    tenantId.Value,
                    user.Phone,
                    cancellationToken
                );
            }
        }

        return Result.Success(request.WhatsAppConsent);
    }
}

public sealed class UpdateConsentSettingsEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/v1/account/privacy", async (
            UpdateConsentSettingsRequest body,
            UpdateConsentSettingsHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? httpContext.User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Identificador de usuario no válido en el token.");
            }

            var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();

            var command = new UpdateConsentSettingsCommand(
                userId,
                body.WhatsAppConsent,
                ip,
                userAgent
            );

            var result = await handler.Handle(command, cancellationToken);

            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("UpdateConsentSettings")
        .WithTags("Account")
        .Produces<bool>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
