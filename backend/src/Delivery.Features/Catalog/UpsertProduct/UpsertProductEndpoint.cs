using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Catalog.UpsertProduct;

public sealed class UpsertProductEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/catalog/products", async (UpsertProductCommand command, UpsertProductHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(command with { ProductId = null }, ct);
            return result.ToHttpResult();
        })
        .WithTags("Catalog")
        .WithName("CreateProduct")
        .WithSummary("Crea un nuevo producto con su imagen y categoría en el catálogo del comercio actual.")
        .RequireAuthorization("TenantAdminOnly")
        .Produces<UpsertProductResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);

        app.MapPut("/api/catalog/products/{id:int}", async (int id, UpsertProductCommand command, UpsertProductHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(command with { ProductId = id }, ct);
            return result.ToHttpResult();
        })
        .WithTags("Catalog")
        .WithName("UpdateProduct")
        .WithSummary("Actualiza nombre, descripción, precio, categoría e imagen de un producto del comercio actual.")
        .RequireAuthorization("TenantAdminOnly")
        .Produces<UpsertProductResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

