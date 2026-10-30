using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tenants.GetCurrentTenant;

public sealed class GetCurrentTenantEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tenants/current", async (GetCurrentTenantHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetCurrentTenantQuery(), ct);
            return result.ToHttpResult();
        })
        .WithTags("Tenants")
        .WithName("GetCurrentTenant")
        .WithSummary("Obtiene la identidad de marca, configuración de landing page, sucursales y métodos de pago del tenant activo.")
        .Produces<TenantStorefrontConfigDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

