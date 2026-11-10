using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Delivery.Features.Account.DeleteAddress;

public sealed record DeleteAddressCommand(Guid UserId, Guid AddressId);

public sealed class DeleteAddressHandler : IHandler<DeleteAddressCommand, Result>
{
    private readonly AppDbContext _context;

    public DeleteAddressHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteAddressCommand request, CancellationToken cancellationToken = default)
    {
        var address = await _context.CustomerAddresses
            .FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == request.UserId, cancellationToken);

        if (address is null)
        {
            return Result.Failure(AccountErrors.AddressNotFound);
        }

        var wasDefault = address.IsDefault;
        _context.CustomerAddresses.Remove(address);

        // Si eliminamos la predeterminada, promover la más reciente
        if (wasDefault)
        {
            var nextDefault = await _context.CustomerAddresses
                .Where(a => a.UserId == request.UserId && a.Id != address.Id)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (nextDefault != null)
            {
                nextDefault.IsDefault = true;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public sealed class DeleteAddressEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/v1/account/addresses/{id:guid}", async (
            Guid id,
            DeleteAddressHandler handler,
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

            var result = await handler.Handle(new DeleteAddressCommand(userId, id), cancellationToken);

            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("DeleteAddress")
        .WithTags("Account")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
