using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Branches.UpdateBranchOperatingHours;

public sealed record UpdateBranchOperatingHoursRequest(
    string OpeningTime,
    string ClosingTime,
    bool? IsActive = null
);

public sealed class UpdateBranchOperatingHoursEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/branches/{id:int}/schedule", async (
            int id,
            UpdateBranchOperatingHoursRequest request,
            UpdateBranchOperatingHoursHandler handler,
            CancellationToken ct) =>
        {
            var command = new UpdateBranchOperatingHoursCommand(
                id,
                request.OpeningTime,
                request.ClosingTime,
                request.IsActive
            );

            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .WithTags("Branches")
        .WithName("UpdateBranchOperatingHours")
        .WithSummary("Actualiza el horario de apertura, cierre y disponibilidad operativa de una sucursal.")
        .RequireAuthorization("BranchStaffOnly")
        .Produces<UpdateBranchOperatingHoursResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

