using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tenants.CreateTenant;

public sealed class CreateTenantEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/tenants", async (
            CreateTenantCommand command,
            CreateTenantHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .WithTags("Tenants")
        .WithName("CreateTenant")
        .WithSummary("Aprovisiona un nuevo comercio (Tenant), sucursal matriz, catálogo base y usuario TenantAdmin.")
        .Produces<CreatedTenantDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

