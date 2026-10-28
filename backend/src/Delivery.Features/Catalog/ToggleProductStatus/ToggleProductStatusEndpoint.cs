using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Catalog.ToggleProductStatus;

public sealed class ToggleProductStatusEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/catalog/products/{id:int}/status", async (int id, ToggleProductStatusCommand command, ToggleProductStatusHandler handler, CancellationToken ct) =>
        {
            var effectiveCommand = command.ProductId == 0 ? command with { ProductId = id } : command;

            if (id != effectiveCommand.ProductId)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Bad Request",
                    detail: "El ID de la ruta no coincide con el payload.",
                    extensions: new Dictionary<string, object?> { ["code"] = "Catalog.IdMismatch" }
                );
            }

            var result = await handler.Handle(effectiveCommand, ct);
            return result.ToHttpResult();
        })
        .WithTags("Catalog")
        .WithName("ToggleProductStatus")
        .WithSummary("Conmuta la disponibilidad de un producto en tiempo real.")
        .Produces<ToggleProductStatusResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

