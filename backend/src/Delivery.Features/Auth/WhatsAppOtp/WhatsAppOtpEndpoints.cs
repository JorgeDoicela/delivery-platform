using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed class WhatsAppOtpEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth/whatsapp").WithTags("Auth");

        // Flujo Inbound $0 (Opción A): crear desafío y consultar estado
        group.MapPost("/challenge", async (
            CreateWhatsAppChallengeRequest request,
            CreateWhatsAppChallengeHandler handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateWhatsAppChallengeCommand(request.TenantSlug);
            var result = await handler.Handle(command, cancellationToken);
            return result.ToHttpResult();
        })
        .WithName("CreateWhatsAppChallenge")
        .Produces<CreateWhatsAppChallengeResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapGet("/challenge/{challengeId}/status", async (
            string challengeId,
            PollWhatsAppChallengeHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var query = new PollWhatsAppChallengeQuery(challengeId);
            var result = await handler.Handle(query, cancellationToken);

            if (result.IsSuccess && result.Value.Status == "authenticated" && !string.IsNullOrWhiteSpace(result.Value.RefreshToken))
            {
                AppendRefreshCookie(httpContext, result.Value.RefreshToken);
            }

            return result.ToHttpResult();
        })
        .WithName("PollWhatsAppChallenge")
        .Produces<PollWhatsAppChallengeResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status403Forbidden);

        // Intercambio de Magic Link de 1 clic enviado desde el chat de WhatsApp API
        group.MapPost("/magic/exchange", async (
            ExchangeWhatsAppMagicLinkRequest request,
            ExchangeWhatsAppMagicLinkHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var command = new ExchangeWhatsAppMagicLinkCommand(request.Token, request.TenantSlug);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsSuccess)
            {
                AppendRefreshCookie(httpContext, result.Value.RefreshToken);
            }

            return result.ToHttpResult();
        })
        .WithName("ExchangeWhatsAppMagicLink")
        .Produces<ExchangeWhatsAppMagicLinkResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // Flujo OTP clásico (compatibilidad retroactiva endurecida)
        group.MapPost("/otp/request", async (
            RequestWhatsAppOtpRequest request,
            RequestWhatsAppOtpHandler handler,
            CancellationToken cancellationToken) =>
        {
            var command = new RequestWhatsAppOtpCommand(request.Phone, request.TenantSlug);
            var result = await handler.Handle(command, cancellationToken);
            return result.ToHttpResult();
        })
        .WithName("RequestWhatsAppOtp")
        .Produces<RequestWhatsAppOtpResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);

        group.MapPost("/otp/verify", async (
            VerifyWhatsAppOtpRequest request,
            VerifyWhatsAppOtpHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var command = new VerifyWhatsAppOtpCommand(request.Phone, request.Code, request.TenantSlug);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsSuccess)
            {
                AppendRefreshCookie(httpContext, result.Value.RefreshToken);
            }

            return result.ToHttpResult();
        })
        .WithName("VerifyWhatsAppOtp")
        .Produces<WhatsAppLoginResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    private static void AppendRefreshCookie(HttpContext httpContext, string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = httpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Path = "/"
        };

        httpContext.Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
