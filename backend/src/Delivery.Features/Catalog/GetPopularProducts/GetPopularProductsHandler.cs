using System.Text.Json;
using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Delivery.Features.Catalog.GetPopularProducts;

#pragma warning disable CA1848

public sealed record GetPopularProductsQuery(int Limit = 8, int Days = 30);

public sealed record PopularModifierOptionDto(
    int Id,
    string Name,
    decimal AdditionalPrice,
    bool IsAvailable
);

public sealed record PopularModifierGroupDto(
    int Id,
    string Name,
    int MinSelectable,
    int MaxSelectable,
    bool IsRequired,
    List<PopularModifierOptionDto> Options
);

public sealed record PopularProductDto(
    int Id,
    string Name,
    string Description,
    decimal BasePrice,
    string ImageUrl,
    string Category,
    bool IsActive,
    int TotalSold,
    List<PopularModifierGroupDto> ModifierGroups
);

public sealed class GetPopularProductsHandler : IHandler<GetPopularProductsQuery, Result<List<PopularProductDto>>>
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<GetPopularProductsHandler> _logger;

    public GetPopularProductsHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IConnectionMultiplexer redis,
        ILogger<GetPopularProductsHandler> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _redis = redis;
        _logger = logger;
    }

    public async Task<Result<List<PopularProductDto>>> Handle(
        GetPopularProductsQuery query,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(query.Limit, 1, 24);
        var days = Math.Clamp(query.Days, 1, 180);
        var tenantId = _tenantContext.TenantId;
        var cacheKey = $"catalog:popular:{tenantId}:{limit}:{days}";
        var db = _redis.GetDatabase();

        // 1. Verificación en Caché Redis (TTL 30 minutos)
        try
        {
            var cached = await db.StringGetAsync(cacheKey);
            if (cached.HasValue)
            {
                var cachedItems = JsonSerializer.Deserialize<List<PopularProductDto>>(cached.ToString());
                if (cachedItems != null && cachedItems.Count > 0)
                {
                    return Result<List<PopularProductDto>>.Success(cachedItems);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error al leer caché Redis para platos populares del tenant {TenantId}. Procediendo con PostgreSQL.", tenantId);
        }

        // 2. Consulta de Ventas Reales en PostgreSQL (Ventana móvil de días, excluyendo cancelaciones)
        var cutoffDate = DateTime.UtcNow.AddDays(-days);

        var salesRanking = await _context.OrderItems
            .AsNoTracking()
            .Where(oi => oi.Order.CreatedAt >= cutoffDate &&
                         oi.Order.Status != OrderStatus.Cancelled &&
                         oi.Product.IsActive)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalSold = g.Sum(oi => oi.Quantity)
            })
            .OrderByDescending(s => s.TotalSold)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var topProductIds = salesRanking.Select(s => s.ProductId).ToList();
        var salesMap = salesRanking.ToDictionary(s => s.ProductId, s => s.TotalSold);

        List<Product> productsWithSales = new();
        if (topProductIds.Count > 0)
        {
            productsWithSales = await _context.Products
                .AsNoTracking()
                .Where(p => topProductIds.Contains(p.Id) && p.IsActive)
                .Include(p => p.CategoryEntity)
                .Include(p => p.ProductModifierGroups)
                    .ThenInclude(pmg => pmg.ModifierGroup)
                        .ThenInclude(mg => mg.Options.Where(o => o.IsAvailable))
                .ToListAsync(cancellationToken);
        }

        // Ordenar exactamente por el ranking de ventas calculado
        var results = productsWithSales
            .OrderByDescending(p => salesMap.TryGetValue(p.Id, out var sold) ? sold : 0)
            .Select(p => MapToDto(p, salesMap.TryGetValue(p.Id, out var sold) ? sold : 0))
            .ToList();

        // 3. Fallback de Arranque en Frío (Cold Start):
        // Si el restaurante es nuevo o tiene menos ventas que el límite solicitado,
        // se completa la selección con platos insignia activos priorizando categorías principales.
        if (results.Count < limit)
        {
            var remaining = limit - results.Count;
            var excludedIds = results.Select(r => r.Id).ToList();

            var fallbackProducts = await _context.Products
                .AsNoTracking()
                .Where(p => p.IsActive && !excludedIds.Contains(p.Id))
                .Include(p => p.CategoryEntity)
                .Include(p => p.ProductModifierGroups)
                    .ThenInclude(pmg => pmg.ModifierGroup)
                        .ThenInclude(mg => mg.Options.Where(o => o.IsAvailable))
                .OrderBy(p => p.CategoryEntity != null ? p.CategoryEntity.DisplayOrder : 999)
                .ThenByDescending(p => p.BasePrice)
                .Take(remaining)
                .ToListAsync(cancellationToken);

            results.AddRange(fallbackProducts.Select(p => MapToDto(p, 0)));
        }

        // 4. Guardar en Caché Redis con TTL de 30 minutos
        try
        {
            var serialized = JsonSerializer.Serialize(results);
            await db.StringSetAsync(cacheKey, serialized, TimeSpan.FromMinutes(30));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error al escribir en caché Redis para platos populares del tenant {TenantId}.", tenantId);
        }

        return Result<List<PopularProductDto>>.Success(results);
    }

    private static PopularProductDto MapToDto(Product p, int totalSold)
    {
        return new PopularProductDto(
            p.Id,
            p.Name,
            p.Description,
            p.BasePrice,
            p.ImageUrl,
            p.Category,
            p.IsActive,
            totalSold,
            p.ProductModifierGroups.Select(pmg => new PopularModifierGroupDto(
                pmg.ModifierGroup.Id,
                pmg.ModifierGroup.Name,
                pmg.ModifierGroup.MinSelectable,
                pmg.ModifierGroup.MaxSelectable,
                pmg.ModifierGroup.IsRequired,
                pmg.ModifierGroup.Options.Select(o => new PopularModifierOptionDto(
                    o.Id,
                    o.Name,
                    o.AdditionalPrice,
                    o.IsAvailable
                )).ToList()
            )).ToList()
        );
    }
}
