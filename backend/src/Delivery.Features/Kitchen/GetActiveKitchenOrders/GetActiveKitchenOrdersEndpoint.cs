using System.Security.Claims;
using Delivery.Core.Contracts;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Kitchen.GetActiveKitchenOrders;

public sealed class GetActiveKitchenOrdersEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/kitchen/branches/{branchId:int}/orders", async (
            int branchId,
            GetActiveKitchenOrdersHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var isSuperAdmin = user.IsInRole("SuperAdmin");
            var isTenantAdmin = user.IsInRole("TenantAdmin");

            // Aislamiento estricto por sucursal: Si el operador tiene branch_id asignado en JWT y no es admin global/comercio
            var branchClaim = user.FindFirst("branch_id")?.Value;
            if (!isSuperAdmin && !isTenantAdmin && !string.IsNullOrEmpty(branchClaim) && int.TryParse(branchClaim, out var staffBranchId))
            {
                if (staffBranchId != branchId)
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status403Forbidden,
                        title: "Acceso no autorizado a sucursal",
                        detail: $"Tu usuario operativo está restringido a la sucursal {staffBranchId} y no puede consultar las comandas de la sucursal {branchId}."
                    );
                }
            }

            var result = await handler.Handle(new GetActiveKitchenOrdersQuery(branchId), ct);
            return result.ToHttpResult();
        })
        .WithTags("Kitchen")
        .WithName("GetActiveKitchenOrders")
        .WithSummary("Obtiene las comandas activas para la pantalla KDS ordenadas bajo criterio FIFO.")
        .RequireAuthorization("KitchenOnly")
        .Produces<List<KitchenOrderTicketDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}

