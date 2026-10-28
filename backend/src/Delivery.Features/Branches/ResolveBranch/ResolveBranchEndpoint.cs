using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Branches.ResolveBranch;

public sealed class ResolveBranchEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/geofencing/resolve", async (ResolveBranchQuery query, ResolveBranchHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(query, ct);
            return result.ToHttpResult();
        })
        .WithTags("Branches")
        .WithName("ResolveBranchByPoint")
        .WithSummary("Evalúa la cobertura geoespacial de una coordenada y asigna la sucursal más cercana.")
        .Produces<BranchCoverageDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);
    }
}

