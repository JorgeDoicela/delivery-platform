using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Catalog.GetActiveMenu;

public sealed record GetActiveMenuQuery;

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
        var products = await _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive)
            .Include(p => p.ProductModifierGroups)
                .ThenInclude(pmg => pmg.ModifierGroup)
                    .ThenInclude(mg => mg.Options.Where(o => o.IsAvailable))
            .OrderBy(p => p.Category)
            .ThenBy(p => p.BasePrice)
            .ToListAsync(cancellationToken);

        var productDtos = products.Select(p => new MenuProductDto(
            p.Id,
            p.Name,
            p.Description,
            p.BasePrice,
            p.ImageUrl,
            p.Category,
            p.IsActive,
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
        )).ToList();

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
