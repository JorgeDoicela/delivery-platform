using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Account.GetMyOrders;

public sealed class GetMyOrdersEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/account/orders", async (
            GetMyOrdersHandler handler,
            HttpContext httpContext,
            int? page,
            int? pageSize,
            string? status,
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

            var query = new GetMyOrdersQuery(
                userId,
                page ?? 1,
                pageSize ?? 10,
                status
            );

            var result = await handler.Handle(query, cancellationToken);

            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("GetMyOrders")
        .WithTags("Account")
        .Produces<GetMyOrdersResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
