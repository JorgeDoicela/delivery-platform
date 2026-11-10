using System.Security.Claims;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Account.UpdateAccountProfile;

public sealed class UpdateAccountProfileEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/v1/account/profile", async (
            UpdateAccountProfileRequest body,
            UpdateAccountProfileHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? httpContext.User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Identificador de usuario no válido en el token.");
            }

            var command = new UpdateAccountProfileCommand(
                userId,
                body.FullName,
                body.Phone,
                body.IdentificationType,
                body.IdentificationNumber
            );

            var result = await handler.Handle(command, cancellationToken);

            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("UpdateAccountProfile")
        .WithTags("Account")
        .Produces<AccountProfileDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
