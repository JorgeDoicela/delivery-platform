using System.Text.Json;
using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Policies;
using Delivery.Core.Domain.ValueObjects;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Tenants.UpdateTenantStorefront;

public sealed record UpdateTenantBankDetailsDto(
    string BankName,
    string AccountType,
    string AccountNumber,
    string AccountHolder,
    string TaxId
);

public sealed record UpdatedTenantBranchSummaryDto(
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
    bool AllowDirectCounterTakeoutDelivery = true
);

public sealed record UpdatedTenantStorefrontDto(
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
    UpdateTenantBankDetailsDto BankDetails,
    List<TenantHeroSlide> HeroSlides,
    List<TenantPromoBanner> PromotionalBanners,
    List<UpdatedTenantBranchSummaryDto> Branches,
    bool RequireCoverageValidation = true,
    bool EnableKitchenWorkflow = true,
    bool AllowDirectCounterTakeoutDelivery = true,
    bool AllowCustomBilling = true,
    List<UpdateTenantBankDetailsDto>? BankAccounts = null,
    bool EnableDynamicDistanceFee = false,
    double BaseDeliveryDistanceKm = 2.0,
    decimal ExtraDeliveryFeePerKm = 0.50m,
    decimal? MaxDeliveryFee = null,
    decimal? FreeDeliveryMinOrderAmount = null
);

public sealed record UpdateTenantStorefrontCommand(
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
    decimal BaseDeliveryFee,
    bool EnableDelivery,
    bool EnableTakeout,
    bool EnableDineIn,
    bool AcceptsCash,
    bool AcceptsBankTransfer,
    bool AcceptsCard,
    bool QuickLinksEnabled,
    string? LandingLayoutTemplate,
    string? CustomDomain,
    string? TermsAndConditionsMarkdown,
    string? PrivacyPolicyMarkdown,
    UpdateTenantBankDetailsDto BankDetails,
    List<TenantHeroSlide> HeroSlides,
    List<TenantPromoBanner> PromotionalBanners,
    bool? RequireCoverageValidation = null,
    bool? EnableKitchenWorkflow = null,
    bool? AllowDirectCounterTakeoutDelivery = null,
    bool? AllowCustomBilling = null,
    List<UpdateTenantBankDetailsDto>? BankAccounts = null,
    bool? EnableDynamicDistanceFee = null,
    double? BaseDeliveryDistanceKm = null,
    decimal? ExtraDeliveryFeePerKm = null,
    decimal? MaxDeliveryFee = null,
    decimal? FreeDeliveryMinOrderAmount = null
);

public sealed class UpdateTenantStorefrontHandler : IHandler<UpdateTenantStorefrontCommand, Result<UpdatedTenantStorefrontDto>>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IValidator<UpdateTenantStorefrontCommand> _validator;

    public UpdateTenantStorefrontHandler(
        AppDbContext context,
        ITenantContext tenantContext,
        IValidator<UpdateTenantStorefrontCommand> validator)
    {
        _context = context;
        _tenantContext = tenantContext;
        _validator = validator;
    }

    public async Task<Result<UpdatedTenantStorefrontDto>> Handle(
        UpdateTenantStorefrontCommand command,
        CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            return Result.Failure<UpdatedTenantStorefrontDto>(
                new Error("Tenant.Validation", validation.Errors[0].ErrorMessage));
        }

        if (!_tenantContext.TenantId.HasValue)
        {
            return Result.Failure<UpdatedTenantStorefrontDto>(
                new Error("Tenant.NotResolved", "No se ha resuelto el contexto del negocio actual."));
        }

        var tenantId = _tenantContext.TenantId.Value;

        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.Settings)
            .Include(t => t.Branches)
            .FirstOrDefaultAsync(t => t.Id == tenantId && t.IsActive, cancellationToken);

        if (tenant == null)
        {
            return Result.Failure<UpdatedTenantStorefrontDto>(
                new Error("Tenant.NotFound", "El negocio solicitado no existe o se encuentra inactivo."));
        }

        var normalizedCustomDomain = string.IsNullOrWhiteSpace(command.CustomDomain)
            ? null
            : command.CustomDomain.Trim().ToLowerInvariant();

        if (normalizedCustomDomain != null)
        {
#pragma warning disable CA1862, CA1304, CA1311
            var domainTaken = await _context.TenantSettings
                .IgnoreQueryFilters()
                .AnyAsync(ts => ts.TenantId != tenant.Id && ts.CustomDomain != null && ts.CustomDomain.ToLower() == normalizedCustomDomain, cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

            if (domainTaken)
            {
                return Result.Failure<UpdatedTenantStorefrontDto>(
                    new Error("Tenant.DuplicateCustomDomain", $"El dominio personalizado '{normalizedCustomDomain}' ya está vinculado a otro comercio."));
            }
        }

        tenant.Name = command.Name.Trim();
        tenant.Tagline = command.Tagline.Trim();
        tenant.Description = command.Description.Trim();
        tenant.HeroSubtitle = command.HeroSubtitle.Trim();
        tenant.BusinessName = command.BusinessName.Trim();
        tenant.TaxId = command.TaxId.Trim();
        tenant.LogoUrl = string.IsNullOrWhiteSpace(command.LogoUrl) ? "/images/shared/placeholders/logo-default.png" : command.LogoUrl.Trim();
        tenant.BrandPrimaryColor = command.BrandPrimaryColor.Trim();
        tenant.BrandPrimaryHoverColor = command.BrandPrimaryHoverColor.Trim();
        tenant.BrandAccentColor = command.BrandAccentColor.Trim();
        tenant.ContactPhone = command.ContactPhone.Trim();
        tenant.ContactEmail = command.ContactEmail.Trim();

        var settings = tenant.Settings;
        if (settings == null)
        {
            settings = new TenantSetting
            {
                TenantId = tenant.Id,
                CurrencyCode = "USD",
                SriEnvironment = "PRUEBAS"
            };
            await _context.TenantSettings.AddAsync(settings, cancellationToken);
        }

        settings.BaseDeliveryFee = command.BaseDeliveryFee;
        settings.EnableDelivery = command.EnableDelivery;
        settings.EnableTakeout = command.EnableTakeout;
        settings.EnableDineIn = command.EnableDineIn;
        settings.AcceptsCash = command.AcceptsCash;
        settings.AcceptsBankTransfer = command.AcceptsBankTransfer;
        settings.AcceptsCard = command.AcceptsCard;
        settings.QuickLinksEnabled = command.QuickLinksEnabled;
        settings.CustomDomain = normalizedCustomDomain;
        if (command.RequireCoverageValidation.HasValue)
        {
            settings.RequireCoverageValidation = command.RequireCoverageValidation.Value;
        }

        if (command.EnableKitchenWorkflow.HasValue)
        {
            settings.EnableKitchenWorkflow = command.EnableKitchenWorkflow.Value;
        }

        if (command.AllowDirectCounterTakeoutDelivery.HasValue)
        {
            settings.AllowDirectCounterTakeoutDelivery = command.AllowDirectCounterTakeoutDelivery.Value;
        }

        if (command.AllowCustomBilling.HasValue)
        {
            settings.AllowCustomBilling = command.AllowCustomBilling.Value;
        }

        if (command.EnableDynamicDistanceFee.HasValue)
        {
            settings.EnableDynamicDistanceFee = command.EnableDynamicDistanceFee.Value;
        }

        if (command.BaseDeliveryDistanceKm.HasValue)
        {
            settings.BaseDeliveryDistanceKm = Math.Round(Math.Max(0.0, command.BaseDeliveryDistanceKm.Value), 2, MidpointRounding.AwayFromZero);
        }

        if (command.ExtraDeliveryFeePerKm.HasValue)
        {
            settings.ExtraDeliveryFeePerKm = Math.Round(Math.Max(0m, command.ExtraDeliveryFeePerKm.Value), 2, MidpointRounding.AwayFromZero);
        }

        if (command.EnableDynamicDistanceFee.HasValue || command.MaxDeliveryFee.HasValue)
        {
            settings.MaxDeliveryFee = command.MaxDeliveryFee.HasValue && command.MaxDeliveryFee.Value > 0m
                ? Math.Round(command.MaxDeliveryFee.Value, 2, MidpointRounding.AwayFromZero)
                : null;
        }

        if (command.EnableDynamicDistanceFee.HasValue || command.FreeDeliveryMinOrderAmount.HasValue)
        {
            settings.FreeDeliveryMinOrderAmount = command.FreeDeliveryMinOrderAmount.HasValue && command.FreeDeliveryMinOrderAmount.Value > 0m
                ? Math.Round(command.FreeDeliveryMinOrderAmount.Value, 2, MidpointRounding.AwayFromZero)
                : null;
        }

        if (!string.IsNullOrWhiteSpace(command.LandingLayoutTemplate))
        {
            settings.LandingLayoutTemplate = command.LandingLayoutTemplate.Trim();
        }
        settings.TermsAndConditionsMarkdown = command.TermsAndConditionsMarkdown;
        settings.PrivacyPolicyMarkdown = command.PrivacyPolicyMarkdown;

        var rawAccounts = command.BankAccounts is not null
            ? command.BankAccounts
            : new List<UpdateTenantBankDetailsDto> { command.BankDetails };

        var normalizedBankAccounts = rawAccounts
            .Where(a => a is not null && (!string.IsNullOrWhiteSpace(a.BankName) || !string.IsNullOrWhiteSpace(a.AccountNumber)))
            .Select(a => new UpdateTenantBankDetailsDto(
                a.BankName?.Trim() ?? string.Empty,
                a.AccountType?.Trim() ?? string.Empty,
                a.AccountNumber?.Trim() ?? string.Empty,
                a.AccountHolder?.Trim() ?? string.Empty,
                a.TaxId?.Trim() ?? string.Empty
            ))
            .ToList();

        var primaryAccount = normalizedBankAccounts.FirstOrDefault() ?? new UpdateTenantBankDetailsDto(
            string.Empty,
            string.Empty,
            string.Empty,
            string.Empty,
            string.Empty
        );

        settings.BankName = primaryAccount.BankName;
        settings.BankAccountType = primaryAccount.AccountType;
        settings.BankAccountNumber = primaryAccount.AccountNumber;
        settings.BankAccountHolder = primaryAccount.AccountHolder;
        settings.BankAccountTaxId = primaryAccount.TaxId;
        settings.BankAccountsJson = JsonSerializer.Serialize(normalizedBankAccounts, JsonOptions);

        var heroSlides = command.HeroSlides ?? new List<TenantHeroSlide>();
        var promos = command.PromotionalBanners ?? new List<TenantPromoBanner>();

        settings.HeroSlidesJson = JsonSerializer.Serialize(heroSlides, JsonOptions);
        settings.PromotionalBannersJson = JsonSerializer.Serialize(promos, JsonOptions);

        await _context.SaveChangesAsync(cancellationToken);

        var branches = tenant.Branches
            .OrderBy(b => b.Id)
            .Select(b => new UpdatedTenantBranchSummaryDto(
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
                KitchenWorkflowPolicy.ResolveKitchenWorkflow(settings.EnableKitchenWorkflow, b.EnableKitchenWorkflowOverride),
                b.AllowDirectCounterTakeoutDeliveryOverride,
                KitchenWorkflowPolicy.ResolveDirectCounterTakeoutDelivery(settings.AllowDirectCounterTakeoutDelivery, b.AllowDirectCounterTakeoutDeliveryOverride)
            ))
            .ToList();

        var dto = new UpdatedTenantStorefrontDto(
            tenant.Id,
            tenant.Slug,
            tenant.Name,
            tenant.Tagline,
            tenant.Description,
            tenant.HeroSubtitle,
            tenant.BusinessName,
            tenant.TaxId,
            tenant.LogoUrl ?? "/images/shared/placeholders/logo-default.png",
            tenant.BrandPrimaryColor ?? "#E4002B",
            tenant.BrandPrimaryHoverColor ?? "#C40024",
            tenant.BrandAccentColor ?? "#F59E0B",
            tenant.ContactPhone ?? "0987654321",
            tenant.ContactEmail ?? $"pedidos@{tenant.Slug}.com",
            settings.CurrencyCode,
            settings.BaseDeliveryFee,
            settings.EnableDelivery,
            settings.EnableTakeout,
            settings.EnableDineIn,
            settings.AcceptsCash,
            settings.AcceptsBankTransfer,
            settings.AcceptsCard,
            settings.QuickLinksEnabled,
            settings.LandingLayoutTemplate,
            settings.CustomDomain,
            settings.TermsAndConditionsMarkdown,
            settings.PrivacyPolicyMarkdown,
            primaryAccount,
            heroSlides.Where(s => s.IsActive).OrderBy(s => s.DisplayOrder).ToList(),
            promos.Where(p => p.IsActive).OrderBy(p => p.DisplayOrder).ToList(),
            branches,
            settings.RequireCoverageValidation,
            settings.EnableKitchenWorkflow,
            settings.AllowDirectCounterTakeoutDelivery,
            settings.AllowCustomBilling,
            normalizedBankAccounts,
            settings.EnableDynamicDistanceFee,
            settings.BaseDeliveryDistanceKm,
            settings.ExtraDeliveryFeePerKm,
            settings.MaxDeliveryFee,
            settings.FreeDeliveryMinOrderAmount
        );

        return Result.Success(dto);
    }
}
