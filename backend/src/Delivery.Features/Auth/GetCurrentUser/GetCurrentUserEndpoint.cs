using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Auth.GetCurrentUser;

public class GetCurrentUserEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/auth/me", async (
            GetCurrentUserHandler handler,
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
                    detail: "Identificador de usuario no valido en el token.");
            }

            var query = new GetCurrentUserQuery(userId);
            var result = await handler.Handle(query, cancellationToken);

            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("GetCurrentUser")
        .WithTags("Auth")
        .Produces<UserInfoDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}

