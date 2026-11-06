using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Drivers.GetDriverProfile;

public sealed class GetDriverProfileEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/driver/me", async (
            GetDriverProfileHandler handler,
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

            var result = await handler.Handle(new GetDriverProfileQuery(userId), ct);
            return result.ToHttpResult();
        })
        .WithTags("Drivers")
        .WithName("GetDriverProfile")
        .WithSummary("Obtiene el perfil del motorizado autenticado y el resumen de su turno actual.")
        .RequireAuthorization("DriverOnly")
        .Produces<DriverProfileResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

