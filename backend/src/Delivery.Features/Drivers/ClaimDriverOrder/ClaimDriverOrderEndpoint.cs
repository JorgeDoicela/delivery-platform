using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Drivers.ClaimDriverOrder;

public sealed class ClaimDriverOrderEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/driver/orders/{orderId:guid}/claim", async (
            Guid orderId,
            ClaimDriverOrderHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? httpContext.User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Identificador de usuario inválido en el token de sesión."
                );
            }

            var command = new ClaimDriverOrderCommand(orderId, userId);
            var result = await handler.Handle(command, ct);

            return result.ToHttpResult();
        })
        .WithTags("Drivers")
        .WithName("ClaimDriverOrder")
        .WithSummary("Asigna una orden de delivery lista en cocina al motorizado y cambia su estado a OnTheWay.")
        .RequireAuthorization("DriverOnly")
        .Produces<ClaimDriverOrderResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
