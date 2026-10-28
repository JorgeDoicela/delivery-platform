using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Catalog.GetActiveMenu;

public sealed class GetActiveMenuEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/catalog/menu", async (GetActiveMenuHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetActiveMenuQuery(), ct);
            return result.ToHttpResult();
        })
        .WithTags("Catalog")
        .WithName("GetActiveMenu")
        .WithSummary("Obtiene el menú activo estructurado por categorías con modificadores.")
        .Produces<ActiveMenuResponse>(StatusCodes.Status200OK);
    }
}

