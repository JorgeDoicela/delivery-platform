using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Auth.RefreshToken;

public class RefreshTokenEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/refresh", async (
            RefreshTokenRequest? bodyRequest,
            RefreshTokenHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Lee el token prioritariamente de la cookie HttpOnly o del cuerpo del payload
            var rawToken = httpContext.Request.Cookies["refreshToken"] ?? bodyRequest?.RefreshToken;

            if (string.IsNullOrWhiteSpace(rawToken))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "No se proporciono ningun refresh token valido.");
            }

            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var command = new RefreshTokenCommand(rawToken, ipAddress);
            var result = await handler.Handle(command, cancellationToken);

            if (result.IsSuccess)
            {
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = httpContext.Request.IsHttps,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTimeOffset.UtcNow.AddDays(7),
                    Path = "/api/v1/auth"
                };

                httpContext.Response.Cookies.Append("refreshToken", result.Value.RefreshToken, cookieOptions);
            }

            return result.ToHttpResult();
        })
        .WithName("RefreshToken")
        .WithTags("Auth")
        .Produces<RefreshTokenResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}

