using System.Text.Json;
using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.ValueObjects;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Tenants.GetCurrentTenant;

public sealed record GetCurrentTenantQuery;

public sealed record TenantBankDetailsDto(
    string BankName,
    string AccountType,
    string AccountNumber,
    string AccountHolder,
    string TaxId
);

public sealed record TenantBranchSummaryDto(
    int Id,
    string Name,
    string Address,
    string Phone,
    string OpeningTime,
    string ClosingTime,
    int MaxOrdersPerSlot,
    double Latitude,
    double Longitude,
    bool IsActive
);

public sealed record TenantStorefrontConfigDto(
    Guid Id,
    string Slug,
    string Name,
    string Tagline,
    string Description,
    string HeroSubtitle,
    string BusinessName,
    string TaxId,
    string LogoUrl,
    string BrandPrimaryColor,
    string BrandPrimaryHoverColor,
    string BrandAccentColor,
    string ContactPhone,
    string ContactEmail,
    string CurrencyCode,
    decimal BaseDeliveryFee,
    bool EnableDelivery,
    bool EnableTakeout,
    bool EnableDineIn,
    bool AcceptsCash,
    bool AcceptsBankTransfer,
    bool AcceptsCard,
    bool QuickLinksEnabled,
    TenantBankDetailsDto BankDetails,
    List<TenantHeroSlide> HeroSlides,
    List<TenantPromoBanner> PromotionalBanners,
    List<TenantBranchSummaryDto> Branches
);

public sealed class GetCurrentTenantHandler : IHandler<GetCurrentTenantQuery, Result<TenantStorefrontConfigDto>>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;

    public GetCurrentTenantHandler(AppDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<Result<TenantStorefrontConfigDto>> Handle(GetCurrentTenantQuery request, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId;
        var tenantQuery = _context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(t => t.Settings)
            .Include(t => t.Branches);

        var tenant = tenantId.HasValue
            ? await tenantQuery.FirstOrDefaultAsync(t => t.Id == tenantId.Value && t.IsActive, cancellationToken)
            : await tenantQuery.OrderBy(t => t.CreatedAt).FirstOrDefaultAsync(t => t.IsActive, cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<TenantStorefrontConfigDto>(
                new Error("Tenant.NotFound", "No se encontró el negocio activo solicitado."));
        }

        var settings = tenant.Settings;
        var heroSlides = DeserializeList<TenantHeroSlide>(settings?.HeroSlidesJson)
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .ToList();

        var promos = DeserializeList<TenantPromoBanner>(settings?.PromotionalBannersJson)
            .Where(p => p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .ToList();

        var branches = tenant.Branches
            .OrderBy(b => b.Id)
            .Select(b => new TenantBranchSummaryDto(
                b.Id,
                b.Name,
                b.Address,
                b.Phone,
                b.OpeningTime,
                b.ClosingTime,
                b.MaxOrdersPerSlot,
                b.LocationPoint.Y,
                b.LocationPoint.X,
                b.IsActive
            ))
            .ToList();

        var dto = new TenantStorefrontConfigDto(
            tenant.Id,
            tenant.Slug,
            tenant.Name,
            string.IsNullOrWhiteSpace(tenant.Tagline) ? "Asadero & Leña" : tenant.Tagline,
            tenant.Description,
            string.IsNullOrWhiteSpace(tenant.HeroSubtitle)
                ? "Personaliza tu orden con guarniciones calientes, ensalada fresca y salsas de la casa"
                : tenant.HeroSubtitle,
            tenant.BusinessName,
            tenant.TaxId,
            tenant.LogoUrl ?? "/images/identidad/logo.png",
            tenant.BrandPrimaryColor ?? "#E4002B",
            tenant.BrandPrimaryHoverColor ?? "#C40024",
            tenant.BrandAccentColor ?? "#F59E0B",
            tenant.ContactPhone ?? "0987654321",
            tenant.ContactEmail ?? $"pedidos@{tenant.Slug}.com",
            settings?.CurrencyCode ?? "USD",
            settings?.BaseDeliveryFee ?? 1.50m,
            settings?.EnableDelivery ?? true,
            settings?.EnableTakeout ?? true,
            settings?.EnableDineIn ?? false,
            settings?.AcceptsCash ?? true,
            settings?.AcceptsBankTransfer ?? true,
            settings?.AcceptsCard ?? false,
            settings?.QuickLinksEnabled ?? true,
            new TenantBankDetailsDto(
                settings?.BankName ?? "Banco Pichincha",
                settings?.BankAccountType ?? "Cuenta Corriente",
                settings?.BankAccountNumber ?? "2100456789",
                settings?.BankAccountHolder ?? tenant.BusinessName,
                settings?.BankAccountTaxId ?? tenant.TaxId
            ),
            heroSlides,
            promos,
            branches
        );

        return Result.Success(dto);
    }

    private static List<T> DeserializeList<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<T>();
        try
        {
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? new List<T>();
        }
        catch
        {
            return new List<T>();
        }
    }
}
