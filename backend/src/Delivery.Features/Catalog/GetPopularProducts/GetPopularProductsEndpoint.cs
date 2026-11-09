using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Catalog.GetPopularProducts;

public sealed class GetPopularProductsEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/catalog/popular", async (
            int? limit,
            int? days,
            GetPopularProductsHandler handler,
            CancellationToken ct) =>
        {
            var query = new GetPopularProductsQuery(limit ?? 8, days ?? 30);
            var result = await handler.Handle(query, ct);
            return result.ToHttpResult();
        })
        .WithTags("Catalog")
        .WithName("GetPopularProducts")
        .WithSummary("Obtiene los platos más vendidos del comercio en base a órdenes reales registradas con caché en Redis y fallback inteligente.")
        .Produces<List<PopularProductDto>>(StatusCodes.Status200OK);
    }
}
