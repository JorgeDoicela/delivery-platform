using Delivery.Core.Contracts;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Kitchen.GetActiveKitchenOrders;

public sealed class GetActiveKitchenOrdersEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/kitchen/branches/{branchId:int}/orders", async (int branchId, GetActiveKitchenOrdersHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetActiveKitchenOrdersQuery(branchId), ct);
            return result.ToHttpResult();
        })
        .WithTags("Kitchen")
        .WithName("GetActiveKitchenOrders")
        .WithSummary("Obtiene las comandas activas para la pantalla KDS ordenadas bajo criterio FIFO.")
        .Produces<List<KitchenOrderTicketDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}

