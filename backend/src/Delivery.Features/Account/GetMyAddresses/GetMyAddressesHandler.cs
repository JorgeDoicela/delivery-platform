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

namespace Delivery.Features.Account.GetMyAddresses;

public sealed record GetMyAddressesQuery(Guid UserId);

public sealed class GetMyAddressesHandler : IHandler<GetMyAddressesQuery, Result<List<AccountAddressDto>>>
{
    private readonly AppDbContext _context;

    public GetMyAddressesHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AccountAddressDto>>> Handle(GetMyAddressesQuery request, CancellationToken cancellationToken = default)
    {
        var addresses = await _context.CustomerAddresses
            .AsNoTracking()
            .Where(a => a.UserId == request.UserId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a => new AccountAddressDto(
                a.Id,
                a.Title,
                a.Street,
                a.Reference,
                a.City,
                a.Latitude,
                a.Longitude,
                a.IsDefault,
                a.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result.Success(addresses);
    }
}

public sealed class GetMyAddressesEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/account/addresses", async (
            GetMyAddressesHandler handler,
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

            var result = await handler.Handle(new GetMyAddressesQuery(userId), cancellationToken);

            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("GetMyAddresses")
        .WithTags("Account")
        .Produces<List<AccountAddressDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}

