using System.Text.Json;
using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Policies;
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
    bool IsActive,
    double? DeliveryRadiusKm = null,
    bool IsCoverageStrict = true,
    bool? EnableKitchenWorkflowOverride = null,
    bool UseKitchenWorkflow = true,
    bool? AllowDirectCounterTakeoutDeliveryOverride = null,
    bool AllowDirectCounterTakeoutDelivery = true,
    decimal? BaseDeliveryFeeOverride = null,
    decimal EffectiveDeliveryFee = 1.50m
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
    string LandingLayoutTemplate,
    string? CustomDomain,
    string? TermsAndConditionsMarkdown,
    string? PrivacyPolicyMarkdown,
    TenantBankDetailsDto BankDetails,
    List<TenantHeroSlide> HeroSlides,
    List<TenantPromoBanner> PromotionalBanners,
    List<TenantBranchSummaryDto> Branches,
    bool RequireCoverageValidation = true,
    bool EnableKitchenWorkflow = true,
    bool AllowDirectCounterTakeoutDelivery = true,
    bool AllowCustomBilling = true,
    List<TenantBankDetailsDto>? BankAccounts = null,
    bool EnableDynamicDistanceFee = false,
    double BaseDeliveryDistanceKm = 2.0,
    decimal ExtraDeliveryFeePerKm = 0.50m,
    decimal? MaxDeliveryFee = null,
    decimal? FreeDeliveryMinOrderAmount = null
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
                new Error("Tenant.NotFound", "No se encontró un establecimiento activo para el contexto solicitado."));
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

        var tenantEnableKitchen = settings?.EnableKitchenWorkflow ?? true;
        var tenantAllowDirectTakeout = settings?.AllowDirectCounterTakeoutDelivery ?? true;
        var tenantBaseDeliveryFee = settings?.BaseDeliveryFee ?? 1.50m;

        var branches = tenant.Branches
            .Where(b => b.IsActive)
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
                b.IsActive,
                b.DeliveryRadiusKm,
                b.IsCoverageStrict,
                b.EnableKitchenWorkflowOverride,
                KitchenWorkflowPolicy.ResolveKitchenWorkflow(tenantEnableKitchen, b.EnableKitchenWorkflowOverride),
                b.AllowDirectCounterTakeoutDeliveryOverride,
                KitchenWorkflowPolicy.ResolveDirectCounterTakeoutDelivery(tenantAllowDirectTakeout, b.AllowDirectCounterTakeoutDeliveryOverride),
                b.BaseDeliveryFeeOverride,
                b.BaseDeliveryFeeOverride ?? tenantBaseDeliveryFee
            ))
            .ToList();

        var dto = new TenantStorefrontConfigDto(
            tenant.Id,
            tenant.Slug,
            tenant.Name,
            string.IsNullOrWhiteSpace(tenant.Tagline) ? "Asadero & Leña" : tenant.Tagline,
            tenant.Description,
            string.IsNullOrWhiteSpace(tenant.HeroSubtitle)
                ? "Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal"
                : tenant.HeroSubtitle,
            tenant.BusinessName,
            tenant.TaxId,
            tenant.LogoUrl ?? "/images/shared/placeholders/logo-default.png",
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
            settings?.LandingLayoutTemplate ?? "asadero-clasico",
            settings?.CustomDomain,
            settings?.TermsAndConditionsMarkdown,
            settings?.PrivacyPolicyMarkdown,
            ResolvePrimaryBankDetails(settings, tenant.BusinessName, tenant.TaxId),
            heroSlides,
            promos,
            branches,
            settings?.RequireCoverageValidation ?? true,
            tenantEnableKitchen,
            tenantAllowDirectTakeout,
            settings?.AllowCustomBilling ?? true,
            ResolveBankAccounts(settings, tenant.BusinessName, tenant.TaxId),
            settings?.EnableDynamicDistanceFee ?? false,
            settings?.BaseDeliveryDistanceKm ?? 2.0,
            settings?.ExtraDeliveryFeePerKm ?? 0.50m,
            settings?.MaxDeliveryFee,
            settings?.FreeDeliveryMinOrderAmount
        );

        return Result.Success(dto);
    }

    private static List<TenantBankDetailsDto> ResolveBankAccounts(
        Delivery.Core.Domain.Entities.TenantSetting? settings,
        string fallbackHolder,
        string fallbackTaxId)
    {
        var parsed = DeserializeList<TenantBankDetailsDto>(settings?.BankAccountsJson)
            .Where(a => !string.IsNullOrWhiteSpace(a.BankName) || !string.IsNullOrWhiteSpace(a.AccountNumber))
            .Select(a => new TenantBankDetailsDto(
                a.BankName?.Trim() ?? string.Empty,
                a.AccountType?.Trim() ?? string.Empty,
                a.AccountNumber?.Trim() ?? string.Empty,
                string.IsNullOrWhiteSpace(a.AccountHolder) ? fallbackHolder : a.AccountHolder.Trim(),
                string.IsNullOrWhiteSpace(a.TaxId) ? fallbackTaxId : a.TaxId.Trim()
            ))
            .ToList();

        if (parsed.Count > 0)
        {
            return parsed;
        }

        if (!string.IsNullOrWhiteSpace(settings?.BankName) || !string.IsNullOrWhiteSpace(settings?.BankAccountNumber))
        {
            return
            [
                new TenantBankDetailsDto(
                    settings?.BankName?.Trim() ?? string.Empty,
                    settings?.BankAccountType?.Trim() ?? string.Empty,
                    settings?.BankAccountNumber?.Trim() ?? string.Empty,
                    string.IsNullOrWhiteSpace(settings?.BankAccountHolder) ? fallbackHolder : settings!.BankAccountHolder!.Trim(),
                    string.IsNullOrWhiteSpace(settings?.BankAccountTaxId) ? fallbackTaxId : settings!.BankAccountTaxId!.Trim()
                )
            ];
        }

        return new List<TenantBankDetailsDto>();
    }

    private static TenantBankDetailsDto ResolvePrimaryBankDetails(
        Delivery.Core.Domain.Entities.TenantSetting? settings,
        string fallbackHolder,
        string fallbackTaxId)
    {
        var accounts = ResolveBankAccounts(settings, fallbackHolder, fallbackTaxId);
        if (accounts.Count > 0)
        {
            return accounts[0];
        }

        return new TenantBankDetailsDto(
            string.Empty,
            string.Empty,
            string.Empty,
            fallbackHolder,
            fallbackTaxId
        );
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
