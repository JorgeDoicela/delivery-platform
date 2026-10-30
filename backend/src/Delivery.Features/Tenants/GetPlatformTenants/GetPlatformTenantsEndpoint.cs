using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tenants.GetPlatformTenants;

public sealed class GetPlatformTenantsEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tenants/platform", async (GetPlatformTenantsHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetPlatformTenantsQuery(), ct);
            return result.ToHttpResult();
        })
        .WithTags("Tenants")
        .WithName("GetPlatformTenants")
        .WithSummary("Obtiene el listado completo de comercios (activos e inactivos) con métricas operativas para SuperAdmin.")
        .Produces<PlatformTenantsResponse>(StatusCodes.Status200OK);
    }
}

