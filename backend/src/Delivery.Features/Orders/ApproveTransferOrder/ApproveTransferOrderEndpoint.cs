using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Orders.ApproveTransferOrder;

public sealed class ApproveTransferOrderEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/orders/{id:guid}/transfer-approval", async (Guid id, ApproveTransferCommand command, ApproveTransferOrderHandler handler, CancellationToken ct) =>
        {
            var effectiveCommand = command.OrderId == Guid.Empty ? command with { OrderId = id } : command;

            if (id != effectiveCommand.OrderId)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Bad Request",
                    detail: "El ID de la ruta no coincide con el payload.",
                    extensions: new Dictionary<string, object?> { ["code"] = "Orders.IdMismatch" }
                );
            }

            var result = await handler.Handle(effectiveCommand, ct);
            return result.ToHttpResult();
        })
        .WithTags("Orders")
        .WithName("ApproveTransferOrder")
        .WithSummary("Valida o rechaza el comprobante de transferencia bancaria.")
        .Produces<ApproveTransferResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

