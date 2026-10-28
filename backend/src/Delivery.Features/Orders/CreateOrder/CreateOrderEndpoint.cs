using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Orders.CreateOrder;

public sealed class CreateOrderEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/orders", async (CreateOrderCommand command, CreateOrderHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult(value => Results.Created($"/api/orders/{value.OrderId}", value));
        })
        .WithTags("Orders")
        .WithName("CreateOrder")
        .WithSummary("Crea un pedido con verificación de inventario, throttling y blindaje de subtotal.")
        .Produces<CreateOrderResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }
}

