using Delivery.Core.Common;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Auth.GoogleAuth;

public class GoogleAuthEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/google", async (
            GoogleAuthRequest request,
            IHandler<GoogleAuthCommand, Result<GoogleAuthResponse>> handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();
            var command = new GoogleAuthCommand(request.IdToken, request.TenantSlug, ip);
            var result = await handler.Handle(command, ct);

            if (!result.IsSuccess)
            {
                return result.ToHttpResult();
            }

            // Adjuntar cookie segura HttpOnly de RefreshToken
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                Path = "/api/v1/auth"
            };

            httpContext.Response.Cookies.Append("refreshToken", result.Value.RefreshToken, cookieOptions);

            return Results.Ok(result.Value);
        })
        .WithName("GoogleAuth")
        .WithTags("Auth")
        .WithDescription("Autenticación e inicio de sesión federado mediante Google Identity Services (OpenID Connect).")
        .Produces<GoogleAuthResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}

