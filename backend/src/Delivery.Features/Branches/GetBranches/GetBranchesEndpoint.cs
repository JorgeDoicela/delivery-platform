using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Branches.GetBranches;

public sealed class GetBranchesEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/branches", async (GetBranchesHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetBranchesQuery(), ct);
            return result.ToHttpResult();
        })
        .WithTags("Branches")
        .WithName("GetBranches")
        .WithSummary("Obtiene las sucursales operativas y coordenadas PostGIS del tenant activo.")
        .Produces<List<BranchDetailDto>>(StatusCodes.Status200OK);
    }
}

