using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tracking.GetDriverLocation;

public sealed class GetDriverLocationEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tracking/orders/{orderId:guid}/driver-location", async (Guid orderId, GetDriverLocationHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetDriverLocationQuery(orderId), ct);
            return result.ToHttpResult();
        })
        .WithTags("Tracking")
        .WithName("GetDriverLocation")
        .WithSummary("Consulta la última ubicación conocida del repartidor asignado a una orden.")
        .Produces<DriverLocationResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

