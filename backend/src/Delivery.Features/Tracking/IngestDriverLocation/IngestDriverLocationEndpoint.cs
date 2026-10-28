using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tracking.IngestDriverLocation;

public sealed class IngestDriverLocationEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/tracking/driver-location", async (IngestDriverLocationCommand command, IngestDriverLocationHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .WithTags("Tracking")
        .WithName("IngestDriverLocation")
        .WithSummary("Ingesta las coordenadas GPS del repartidor en Redis GEO y las retransmite al cliente en vivo.")
        .Produces<IngestDriverLocationResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}

