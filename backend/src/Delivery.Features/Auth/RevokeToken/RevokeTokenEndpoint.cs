using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Auth.RevokeToken;

public class RevokeTokenEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/logout", async (
            RevokeTokenRequest? bodyRequest,
            RevokeTokenHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var rawToken = httpContext.Request.Cookies["refreshToken"] ?? bodyRequest?.RefreshToken;

            if (!string.IsNullOrWhiteSpace(rawToken))
            {
                var command = new RevokeTokenCommand(rawToken);
                await handler.Handle(command, cancellationToken);
            }

            // Elimina la cookie del cliente
            httpContext.Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                Path = "/api/v1/auth",
                HttpOnly = true,
                Secure = httpContext.Request.IsHttps,
                SameSite = SameSiteMode.Strict
            });

            return Results.Ok(new { message = "Sesion cerrada exitosamente." });
        })
        .WithName("RevokeToken")
        .WithTags("Auth")
        .Produces(StatusCodes.Status200OK);
    }
}

