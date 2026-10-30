using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tenants.UpdateTenantStorefront;

public sealed class UpdateTenantStorefrontEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/tenants/current/storefront", async (
            UpdateTenantStorefrontCommand command,
            UpdateTenantStorefrontHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .WithTags("Tenants")
        .WithName("UpdateTenantStorefront")
        .WithSummary("Actualiza la identidad visual, landing page, tarifas, métodos de pago y banners del tenant activo.")
        .Produces<UpdatedTenantStorefrontDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
