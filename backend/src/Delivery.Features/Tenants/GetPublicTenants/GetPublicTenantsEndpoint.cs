using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tenants.GetPublicTenants;

public sealed class GetPublicTenantsEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tenants", async (GetPublicTenantsHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetPublicTenantsQuery(), ct);
            return result.ToHttpResult();
        })
        .WithTags("Tenants")
        .WithName("GetPublicTenants")
        .WithSummary("Obtiene el directorio público de negocios activos en la plataforma multi-tenant.")
        .Produces<PublicTenantsResponse>(StatusCodes.Status200OK);
    }
}

