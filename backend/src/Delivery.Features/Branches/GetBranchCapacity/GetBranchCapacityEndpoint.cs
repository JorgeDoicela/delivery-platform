using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Branches.GetBranchCapacity;

public sealed class GetBranchCapacityEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/branches/{branchId:int}/capacity", async (int branchId, GetBranchCapacityHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetBranchCapacityQuery(branchId), ct);
            return result.ToHttpResult();
        })
        .WithTags("Branches")
        .WithName("GetBranchCapacity")
        .WithSummary("Consulta la carga operativa y el tiempo de entrega estimado de una sucursal.")
        .Produces<BranchCapacityResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

