using System.Text.Json;
using Delivery.Core.Common;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
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
    bool IsActive
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
    UpdateTenantBankDetailsDto BankDetails,
    List<TenantHeroSlide> HeroSlides,
    List<TenantPromoBanner> PromotionalBanners,
    List<UpdatedTenantBranchSummaryDto> Branches
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
    UpdateTenantBankDetailsDto BankDetails,
    List<TenantHeroSlide> HeroSlides,
    List<TenantPromoBanner> PromotionalBanners
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

        tenant.Name = command.Name.Trim();
        tenant.Tagline = command.Tagline.Trim();
        tenant.Description = command.Description.Trim();
        tenant.HeroSubtitle = command.HeroSubtitle.Trim();
        tenant.BusinessName = command.BusinessName.Trim();
        tenant.TaxId = command.TaxId.Trim();
        tenant.LogoUrl = string.IsNullOrWhiteSpace(command.LogoUrl) ? "/images/identidad/logo.png" : command.LogoUrl.Trim();
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
        settings.BankName = command.BankDetails.BankName.Trim();
        settings.BankAccountType = command.BankDetails.AccountType.Trim();
        settings.BankAccountNumber = command.BankDetails.AccountNumber.Trim();
        settings.BankAccountHolder = command.BankDetails.AccountHolder.Trim();
        settings.BankAccountTaxId = command.BankDetails.TaxId.Trim();

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
                b.IsActive
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
            tenant.LogoUrl ?? "/images/identidad/logo.png",
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
            new UpdateTenantBankDetailsDto(
                settings.BankName ?? "Banco Pichincha",
                settings.BankAccountType ?? "Cuenta Corriente",
                settings.BankAccountNumber ?? "2100456789",
                settings.BankAccountHolder ?? tenant.BusinessName,
                settings.BankAccountTaxId ?? tenant.TaxId
            ),
            heroSlides.Where(s => s.IsActive).OrderBy(s => s.DisplayOrder).ToList(),
            promos.Where(p => p.IsActive).OrderBy(p => p.DisplayOrder).ToList(),
            branches
        );

        return Result.Success(dto);
    }
}
