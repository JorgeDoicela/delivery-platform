using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Tenants.ToggleTenantStatus;

public sealed class ToggleTenantStatusEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/tenants/{tenantId:guid}/status", async (
            Guid tenantId,
            ToggleTenantStatusRequest request,
            ToggleTenantStatusHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new ToggleTenantStatusCommand(tenantId, request.IsActive), ct);
            return result.ToHttpResult();
        })
        .WithTags("Tenants")
        .WithName("ToggleTenantStatus")
        .WithSummary("Activa o suspende operativamente un comercio dentro de la plataforma multi-tenant.")
        .Produces<ToggleTenantStatusResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

