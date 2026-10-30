using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Tenants.GetPublicTenants;

public sealed record GetPublicTenantsQuery;

public sealed record PublicTenantSummaryDto(
    Guid Id,
    string Slug,
    string Name,
    string Tagline,
    string Description,
    string LogoUrl,
    string BrandPrimaryColor,
    string BrandPrimaryHoverColor,
    string BrandAccentColor,
    decimal BaseDeliveryFee,
    int ActiveBranchesCount,
    string PrimaryBranchAddress
);

public sealed record PublicTenantsResponse(
    List<PublicTenantSummaryDto> Tenants
);

public sealed class GetPublicTenantsHandler : IHandler<GetPublicTenantsQuery, Result<PublicTenantsResponse>>
{
    private readonly AppDbContext _context;

    public GetPublicTenantsHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PublicTenantsResponse>> Handle(GetPublicTenantsQuery request, CancellationToken cancellationToken = default)
    {
        var tenants = await _context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(t => t.IsActive)
            .Include(t => t.Settings)
            .Include(t => t.Branches.Where(b => b.IsActive))
            .OrderBy(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = tenants.Select(t => new PublicTenantSummaryDto(
            t.Id,
            t.Slug,
            t.Name,
            string.IsNullOrWhiteSpace(t.Tagline) ? "Restaurante & Delivery" : t.Tagline,
            t.Description,
            t.LogoUrl ?? "/images/identidad/logo.png",
            t.BrandPrimaryColor ?? "#E4002B",
            t.BrandPrimaryHoverColor ?? "#C40024",
            t.BrandAccentColor ?? "#F59E0B",
            t.Settings?.BaseDeliveryFee ?? 1.50m,
            t.Branches.Count,
            t.Branches.OrderBy(b => b.Id).FirstOrDefault()?.Address ?? "Matriz Principal"
        )).ToList();

        return Result.Success(new PublicTenantsResponse(dtos));
    }
}

