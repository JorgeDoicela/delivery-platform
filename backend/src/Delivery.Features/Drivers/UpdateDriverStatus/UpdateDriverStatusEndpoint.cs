using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Drivers.UpdateDriverStatus;

public sealed record UpdateDriverStatusRequest(
    bool IsAvailable,
    string? VehicleType = null,
    string? LicensePlate = null
);

public sealed class UpdateDriverStatusEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/driver/status", async (
            UpdateDriverStatusRequest request,
            UpdateDriverStatusHandler handler,
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

            var command = new UpdateDriverStatusCommand(
                userId,
                request.IsAvailable,
                request.VehicleType,
                request.LicensePlate
            );

            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .WithTags("Drivers")
        .WithName("UpdateDriverStatus")
        .WithSummary("Actualiza la disponibilidad (en turno / pausado) y datos del vehículo del motorizado.")
        .RequireAuthorization("DriverOnly")
        .Produces<UpdateDriverStatusResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
