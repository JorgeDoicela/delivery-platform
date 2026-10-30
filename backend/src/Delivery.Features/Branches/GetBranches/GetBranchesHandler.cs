using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Branches.GetBranches;

public sealed record GetBranchesQuery;

public sealed record BranchDetailDto(
    int Id,
    string Name,
    string Address,
    string Phone,
    string OpeningTime,
    string ClosingTime,
    int MaxOrdersPerSlot,
    string SriEstablishmentCode,
    string SriEmissionPoint,
    double Latitude,
    double Longitude,
    bool IsActive
);

public sealed class GetBranchesHandler : IHandler<GetBranchesQuery, Result<List<BranchDetailDto>>>
{
    private readonly AppDbContext _context;

    public GetBranchesHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<BranchDetailDto>>> Handle(GetBranchesQuery query, CancellationToken cancellationToken = default)
    {
        var branches = await _context.Branches
            .AsNoTracking()
            .OrderBy(b => b.Id)
            .Select(b => new BranchDetailDto(
                b.Id,
                b.Name,
                b.Address,
                b.Phone,
                b.OpeningTime,
                b.ClosingTime,
                b.MaxOrdersPerSlot,
                b.SriEstablishmentCode,
                b.SriEmissionPoint,
                b.LocationPoint.Y,
                b.LocationPoint.X,
                b.IsActive
            ))
            .ToListAsync(cancellationToken);

        return Result.Success(branches);
    }
}

