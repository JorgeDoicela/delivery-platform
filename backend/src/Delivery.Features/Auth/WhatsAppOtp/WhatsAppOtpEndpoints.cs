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
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = httpContext.Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddDays(7),
                    Path = "/"
                };

                httpContext.Response.Cookies.Append("refreshToken", result.Value.RefreshToken, cookieOptions);
            }

            return result.ToHttpResult();
        })
        .WithName("VerifyWhatsAppOtp")
        .Produces<WhatsAppLoginResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
