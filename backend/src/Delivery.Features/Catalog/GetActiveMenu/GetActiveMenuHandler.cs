using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Catalog.GetActiveMenu;

public sealed record GetActiveMenuQuery(bool IncludeInactive = false, int? BranchId = null);

public sealed record MenuModifierOptionDto(
    int Id,
    string Name,
    decimal AdditionalPrice,
    bool IsAvailable
);

public sealed record MenuModifierGroupDto(
    int Id,
    string Name,
    int MinSelectable,
    int MaxSelectable,
    bool IsRequired,
    List<MenuModifierOptionDto> Options
);

public sealed record MenuProductDto(
    int Id,
    string Name,
    string Description,
    decimal BasePrice,
    string ImageUrl,
    string Category,
    bool IsActive,
    List<MenuModifierGroupDto> ModifierGroups
);

public sealed record MenuCategoryDto(
    string CategoryName,
    List<MenuProductDto> Products
);

public sealed record ActiveMenuResponse(
    List<MenuCategoryDto> Categories,
    int TotalProducts
);

public sealed class GetActiveMenuHandler : IHandler<GetActiveMenuQuery, Result<ActiveMenuResponse>>
{
    private readonly AppDbContext _context;

    public GetActiveMenuHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ActiveMenuResponse>> Handle(GetActiveMenuQuery query, CancellationToken cancellationToken = default)
    {
        var productsQuery = _context.Products.AsNoTracking();
        if (!query.IncludeInactive)
        {
            productsQuery = productsQuery.Where(p => p.IsActive);
        }

        var products = await productsQuery
            .Include(p => p.CategoryEntity)
            .Include(p => p.ProductModifierGroups)
                .ThenInclude(pmg => pmg.ModifierGroup)
                    .ThenInclude(mg => mg.Options.Where(o => o.IsAvailable))
            .OrderBy(p => p.CategoryEntity != null ? p.CategoryEntity.DisplayOrder : 999)
            .ThenByDescending(p => p.BasePrice)
            .ToListAsync(cancellationToken);

        // Aplicar overrides de disponibilidad y precio por sucursal si se solicitó una sucursal específica
        var branchOverrides = new Dictionary<int, Delivery.Core.Domain.Entities.BranchProduct>();
        if (query.BranchId.HasValue && query.BranchId.Value > 0)
        {
            var productIds = products.Select(p => p.Id).ToList();
            branchOverrides = await _context.BranchProducts
                .AsNoTracking()
                .Where(bp => bp.BranchId == query.BranchId.Value && productIds.Contains(bp.ProductId))
                .ToDictionaryAsync(bp => bp.ProductId, cancellationToken);
        }

        var productDtos = products
            .Where(p =>
                query.IncludeInactive ||
                !branchOverrides.TryGetValue(p.Id, out var bp) ||
                bp.IsAvailable)
            .Select(p =>
            {
                var hasOverride = branchOverrides.TryGetValue(p.Id, out var bp);
                var effectivePrice = hasOverride && bp!.CustomPrice.HasValue
                    ? bp.CustomPrice.Value
                    : p.BasePrice;
                var effectiveActive = p.IsActive && (!hasOverride || bp!.IsAvailable);

                return new MenuProductDto(
                    p.Id,
                    p.Name,
                    p.Description,
                    effectivePrice,
                    p.ImageUrl,
                    p.Category,
                    effectiveActive,
                    p.ProductModifierGroups.Select(pmg => new MenuModifierGroupDto(
                        pmg.ModifierGroup.Id,
                        pmg.ModifierGroup.Name,
                        pmg.ModifierGroup.MinSelectable,
                        pmg.ModifierGroup.MaxSelectable,
                        pmg.ModifierGroup.IsRequired,
                        pmg.ModifierGroup.Options.Select(o => new MenuModifierOptionDto(
                            o.Id,
                            o.Name,
                            o.AdditionalPrice,
                            o.IsAvailable
                        )).ToList()
                    )).ToList()
                );
            })
            .ToList();

        var categories = productDtos
            .GroupBy(p => p.Category)
            .Select(g => new MenuCategoryDto(
                g.Key,
                g.ToList()
            ))
            .ToList();

        return Result.Success(new ActiveMenuResponse(categories, productDtos.Count));
    }
}
