using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Orders.GetOrderById;

public sealed class GetOrderByIdEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/orders/{id:guid}", async (
            Guid id,
            GetOrderByIdHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            Guid? requesterUserId = null;
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? httpContext.User.FindFirstValue("sub");

            if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedId))
            {
                requesterUserId = parsedId;
            }

            var roles = httpContext.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            var query = new GetOrderByIdQuery(id, requesterUserId, roles);

            var result = await handler.Handle(query, ct);
            return result.ToHttpResult();
        })
        .WithTags("Orders")
        .WithName("GetOrderById")
        .WithSummary("Obtiene los detalles completos y liquidación contable de una orden con verificación de propiedad y tenant.")
        .Produces<OrderDetailResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

