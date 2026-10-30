using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Tenants.GetPlatformTenants;

public sealed record GetPlatformTenantsQuery;

public sealed record PlatformTenantItemDto(
    Guid Id,
    string Slug,
    string Name,
    string BusinessName,
    string TaxId,
    string Tagline,
    string Description,
    string LogoUrl,
    string BrandPrimaryColor,
    string BrandPrimaryHoverColor,
    string BrandAccentColor,
    string ContactPhone,
    string ContactEmail,
    decimal BaseDeliveryFee,
    bool IsActive,
    int BranchesCount,
    int ProductsCount,
    string AdminEmail,
    string PrimaryBranchAddress,
    DateTime CreatedAt
);

public sealed record PlatformTenantsResponse(
    List<PlatformTenantItemDto> Tenants
);

public sealed class GetPlatformTenantsHandler : IHandler<GetPlatformTenantsQuery, Result<PlatformTenantsResponse>>
{
    private readonly AppDbContext _context;

    public GetPlatformTenantsHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PlatformTenantsResponse>> Handle(GetPlatformTenantsQuery request, CancellationToken cancellationToken = default)
    {
        var tenants = await _context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(t => t.Settings)
            .Include(t => t.Branches)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        var productsByTenant = await _context.Products
            .IgnoreQueryFilters()
            .AsNoTracking()
            .GroupBy(p => p.TenantId)
            .Select(g => new { TenantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TenantId, x => x.Count, cancellationToken);

        var tenantUsers = await _context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.TenantId != null)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .ToListAsync(cancellationToken);

        var dtos = tenants.Select(t =>
        {
            var adminUser = tenantUsers
                .Where(u => u.TenantId == t.Id)
                .OrderByDescending(u => u.UserRoles.Any(ur => ur.Role.Name == "TenantAdmin"))
                .FirstOrDefault();

            return new PlatformTenantItemDto(
                t.Id,
                t.Slug,
                t.Name,
                t.BusinessName,
                t.TaxId,
                string.IsNullOrWhiteSpace(t.Tagline) ? "Restaurante & Delivery" : t.Tagline,
                t.Description,
                t.LogoUrl ?? "/images/identidad/logo.png",
                t.BrandPrimaryColor ?? "#E4002B",
                t.BrandPrimaryHoverColor ?? "#C40024",
                t.BrandAccentColor ?? "#F59E0B",
                t.ContactPhone ?? "",
                t.ContactEmail ?? "",
                t.Settings?.BaseDeliveryFee ?? 1.50m,
                t.IsActive,
                t.Branches.Count,
                productsByTenant.GetValueOrDefault(t.Id, 0),
                adminUser?.Email ?? t.ContactEmail ?? "sin-asignar@plataforma.com",
                t.Branches.OrderBy(b => b.Id).FirstOrDefault()?.Address ?? "Matriz Principal",
                t.CreatedAt
            );
        }).ToList();

        return Result.Success(new PlatformTenantsResponse(dtos));
    }
}

