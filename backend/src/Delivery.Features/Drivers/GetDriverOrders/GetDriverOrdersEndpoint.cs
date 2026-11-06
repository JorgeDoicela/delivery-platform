using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Drivers.GetDriverOrders;

public sealed class GetDriverOrdersEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/driver/orders", async (
            int? branchId,
            GetDriverOrdersHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? httpContext.User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Identificador de usuario inválido en el token de sesión."
                );
            }

            // Si no se suministra branchId por querystring, intentar extraer de claims
            int? effectiveBranchId = branchId;
            if (!effectiveBranchId.HasValue)
            {
                var branchClaim = httpContext.User.FindFirstValue("branch_id");
                if (!string.IsNullOrWhiteSpace(branchClaim) && int.TryParse(branchClaim, out var parsedBranch))
                {
                    effectiveBranchId = parsedBranch;
                }
            }

            var query = new GetDriverOrdersQuery(userId, effectiveBranchId);
            var result = await handler.Handle(query, ct);

            return result.ToHttpResult();
        })
        .WithTags("Drivers")
        .WithName("GetDriverOrders")
        .WithSummary("Obtiene las órdenes activas, disponibles en cocina y completadas hoy por el motorizado.")
        .RequireAuthorization("DriverOnly")
        .Produces<DriverOrdersResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

