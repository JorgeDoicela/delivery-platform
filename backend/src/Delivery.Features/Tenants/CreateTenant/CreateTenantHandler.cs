using System.Text.Json;
using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.ValueObjects;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Delivery.Features.Tenants.CreateTenant;

public sealed record CreateTenantCommand(
    string Name,
    string Slug,
    string BusinessName,
    string TaxId,
    string Tagline,
    string Description,
    string BrandPrimaryColor,
    string BrandPrimaryHoverColor,
    string BrandAccentColor,
    decimal BaseDeliveryFee,
    string ContactPhone,
    string ContactEmail,
    string PrimaryBranchName,
    string PrimaryBranchAddress,
    string AdminFullName,
    string AdminEmail,
    string AdminPassword,
    string? LogoUrl = null,
    string? LandingLayoutTemplate = null,
    string? HeroBannerImageUrl = null,
    string? CustomDomain = null
);

public sealed record CreatedTenantDto(
    Guid Id,
    string Slug,
    string Name,
    string BusinessName,
    string TaxId,
    string BrandPrimaryColor,
    bool IsActive,
    string AdminEmail,
    int PrimaryBranchId
);

public sealed class CreateTenantHandler : IHandler<CreateTenantCommand, Result<CreatedTenantDto>>
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly AppDbContext _context;
    private readonly IValidator<CreateTenantCommand> _validator;
    private readonly IPasswordHasher _passwordHasher;

    public CreateTenantHandler(
        AppDbContext context,
        IValidator<CreateTenantCommand> validator,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _validator = validator;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<CreatedTenantDto>> Handle(CreateTenantCommand request, CancellationToken cancellationToken = default)
    {
        var normalizedCommand = request with
        {
            Slug = request.Slug.Trim().ToLowerInvariant(),
            AdminEmail = request.AdminEmail.Trim().ToLowerInvariant()
        };

        var validationResult = await _validator.ValidateAsync(normalizedCommand, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Result.Failure<CreatedTenantDto>(
                new Error("Tenant.Validation", validationResult.Errors[0].ErrorMessage));
        }

        var slugExists = await _context.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Slug == normalizedCommand.Slug, cancellationToken);

        if (slugExists)
        {
            return Result.Failure<CreatedTenantDto>(
                new Error("Tenant.DuplicateSlug", $"El identificador '{normalizedCommand.Slug}' ya está registrado por otro comercio."));
        }

        var taxIdExists = await _context.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.TaxId == normalizedCommand.TaxId.Trim(), cancellationToken);

        if (taxIdExists)
        {
            return Result.Failure<CreatedTenantDto>(
                new Error("Tenant.DuplicateTaxId", $"El RUC/Identificación '{normalizedCommand.TaxId}' ya se encuentra registrado."));
        }

#pragma warning disable CA1862, CA1304, CA1311
        var emailExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == normalizedCommand.AdminEmail, cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

        if (emailExists)
        {
            return Result.Failure<CreatedTenantDto>(
                new Error("Tenant.DuplicateAdminEmail", $"El correo '{normalizedCommand.AdminEmail}' ya está asignado a un usuario."));
        }

        var defaultSlides = new List<TenantHeroSlide>
        {
            new()
            {
                Id = $"slide-{normalizedCommand.Slug}-1",
                Badge = string.IsNullOrWhiteSpace(normalizedCommand.Tagline) ? "Especialidad de la Casa" : normalizedCommand.Tagline,
                Title = $"BIENVENIDOS A {normalizedCommand.Name.ToUpperInvariant()}",
                Subtitle = string.IsNullOrWhiteSpace(normalizedCommand.Description)
                    ? "Especialidades preparadas al momento con ingredientes frescos y entrega a domicilio."
                    : normalizedCommand.Description,
                CtaText = "VER MENÚ",
                CtaHref = "/catalogo",
                ImageUrl = string.IsNullOrWhiteSpace(normalizedCommand.HeroBannerImageUrl)
                    ? "/images/shared/placeholders/dish-default.webp"
                    : normalizedCommand.HeroBannerImageUrl.Trim(),
                DisplayOrder = 1,
                IsActive = true
            }
        };

        var defaultPromos = new List<TenantPromoBanner>
        {
            new()
            {
                Id = $"promo-{normalizedCommand.Slug}-1",
                Title = "Calidad y Sabor Garantizado",
                Subtitle = "Conoce nuestras promociones exclusivas pidiendo directamente en nuestra tienda oficial.",
                CtaText = "Ordenar Ahora",
                CtaHref = "/catalogo",
                ImageUrl = "/images/shared/placeholders/dish-default.webp",
                ThemeVariant = "dark",
                DisplayOrder = 1,
                IsActive = true
            }
        };

        var normalizedCustomDomain = string.IsNullOrWhiteSpace(normalizedCommand.CustomDomain)
            ? null
            : normalizedCommand.CustomDomain.Trim().ToLowerInvariant();

        if (normalizedCustomDomain != null)
        {
#pragma warning disable CA1862, CA1304, CA1311
            var domainExists = await _context.TenantSettings
                .IgnoreQueryFilters()
                .AnyAsync(ts => ts.CustomDomain != null && ts.CustomDomain.ToLower() == normalizedCustomDomain, cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

            if (domainExists)
            {
                return Result.Failure<CreatedTenantDto>(
                    new Error("Tenant.DuplicateCustomDomain", $"El dominio personalizado '{normalizedCustomDomain}' ya está vinculado a otro comercio."));
            }
        }

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = normalizedCommand.Name.Trim(),
            Slug = normalizedCommand.Slug,
            Tagline = string.IsNullOrWhiteSpace(normalizedCommand.Tagline) ? "Restaurante & Delivery" : normalizedCommand.Tagline.Trim(),
            Description = normalizedCommand.Description.Trim(),
            HeroSubtitle = "Elige tu especialidad favorita recién preparada",
            BusinessName = normalizedCommand.BusinessName.Trim(),
            TaxId = normalizedCommand.TaxId.Trim(),
            LogoUrl = string.IsNullOrWhiteSpace(normalizedCommand.LogoUrl)
                ? "/images/shared/placeholders/logo-default.png"
                : normalizedCommand.LogoUrl.Trim(),
            BrandPrimaryColor = normalizedCommand.BrandPrimaryColor.Trim(),
            BrandPrimaryHoverColor = string.IsNullOrWhiteSpace(normalizedCommand.BrandPrimaryHoverColor)
                ? normalizedCommand.BrandPrimaryColor.Trim()
                : normalizedCommand.BrandPrimaryHoverColor.Trim(),
            BrandAccentColor = string.IsNullOrWhiteSpace(normalizedCommand.BrandAccentColor)
                ? "#F59E0B"
                : normalizedCommand.BrandAccentColor.Trim(),
            ContactPhone = normalizedCommand.ContactPhone.Trim(),
            ContactEmail = normalizedCommand.ContactEmail.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            Settings = new TenantSetting
            {
                CurrencyCode = "USD",
                SriEnvironment = "PRUEBAS",
                BaseDeliveryFee = normalizedCommand.BaseDeliveryFee,
                EnableDelivery = true,
                EnableTakeout = true,
                EnableDineIn = true,
                AcceptsCash = true,
                AcceptsBankTransfer = true,
                AcceptsCard = true,
                QuickLinksEnabled = true,
                CustomDomain = normalizedCustomDomain,
                LandingLayoutTemplate = string.IsNullOrWhiteSpace(normalizedCommand.LandingLayoutTemplate)
                    ? "asadero-clasico"
                    : normalizedCommand.LandingLayoutTemplate.Trim(),
                BankName = "Banco Pichincha",
                BankAccountType = "Cuenta Corriente",
                BankAccountNumber = "2100000000",
                BankAccountHolder = normalizedCommand.BusinessName.Trim(),
                BankAccountTaxId = normalizedCommand.TaxId.Trim(),
                HeroSlidesJson = JsonSerializer.Serialize(defaultSlides, JsonOptions),
                PromotionalBannersJson = JsonSerializer.Serialize(defaultPromos, JsonOptions)
            }
        };

        await _context.Tenants.AddAsync(tenant, cancellationToken);

        var defaultPolygon = GeometryFactory.CreatePolygon(new Coordinate[]
        {
            new(-78.5200, -0.1400),
            new(-78.4500, -0.1400),
            new(-78.4500, -0.2200),
            new(-78.5200, -0.2200),
            new(-78.5200, -0.1400)
        });

        var branch = new Branch
        {
            TenantId = tenant.Id,
            Name = normalizedCommand.PrimaryBranchName.Trim(),
            Address = normalizedCommand.PrimaryBranchAddress.Trim(),
            Phone = normalizedCommand.ContactPhone.Trim(),
            LocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.4840, -0.1760)),
            CoveragePolygon = defaultPolygon,
            MaxOrdersPerSlot = 15,
            SriEstablishmentCode = "001",
            SriEmissionPoint = "001",
            NextInvoiceSequence = 1,
            OpeningTime = "10:00",
            ClosingTime = "22:00",
            IsActive = true
        };

        await _context.Branches.AddAsync(branch, cancellationToken);

        var modGroup = new ModifierGroup
        {
            TenantId = tenant.Id,
            Name = "Guarnición & Acompañantes",
            MinSelectable = 1,
            MaxSelectable = 2,
            IsRequired = true,
            Options = new List<ModifierOption>
            {
                new() { Name = "Acompañamiento Clásico de la Casa", AdditionalPrice = 0.00m, IsAvailable = true },
                new() { Name = "Ensalada o Guarnición Fresca", AdditionalPrice = 0.00m, IsAvailable = true },
                new() { Name = "Porción Extra Salsa de la Casa", AdditionalPrice = 0.75m, IsAvailable = true }
            }
        };
        await _context.ModifierGroups.AddAsync(modGroup, cancellationToken);

        var combosCategory = new Category
        {
            TenantId = tenant.Id,
            Name = "Combos",
            DisplayOrder = 1,
            IsActive = true
        };
        var porcionesCategory = new Category
        {
            TenantId = tenant.Id,
            Name = "Especialidades",
            DisplayOrder = 2,
            IsActive = true
        };
        await _context.Categories.AddRangeAsync(new[] { combosCategory, porcionesCategory }, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var skuPrefix = normalizedCommand.Slug.ToUpperInvariant();
        var starterProducts = new List<Product>
        {
            new()
            {
                TenantId = tenant.Id,
                CategoryId = combosCategory.Id,
                Sku = $"{skuPrefix}-001",
                Name = $"Combo Familiar {tenant.Name}",
                Description = "Combinación familiar completa de la casa acompañada de guarniciones, complementos frescos y salsas artesanales.",
                BasePrice = 21.99m,
                TaxRate = 15.00m,
                ImageUrl = "/images/shared/placeholders/dish-default.webp",
                Category = combosCategory.Name,
                IsKitchen = true,
                IsActive = true
            },
            new()
            {
                TenantId = tenant.Id,
                CategoryId = combosCategory.Id,
                Sku = $"{skuPrefix}-002",
                Name = $"Especialidad Principal {tenant.Name}",
                Description = "Plato estrella de la casa preparado al momento con ingredientes frescos seleccionados y acompañamiento a elección.",
                BasePrice = 11.50m,
                TaxRate = 15.00m,
                ImageUrl = "/images/shared/placeholders/dish-default.webp",
                Category = combosCategory.Name,
                IsKitchen = true,
                IsActive = true
            },
            new()
            {
                TenantId = tenant.Id,
                CategoryId = porcionesCategory.Id,
                Sku = $"{skuPrefix}-003",
                Name = $"Menú Individual {tenant.Name}",
                Description = "Porción personal recién preparada acompañada de guarnición clásica y aderezo artesanal de la casa.",
                BasePrice = 6.50m,
                TaxRate = 15.00m,
                ImageUrl = "/images/shared/placeholders/dish-default.webp",
                Category = porcionesCategory.Name,
                IsKitchen = true,
                IsActive = true
            }
        };
        await _context.Products.AddRangeAsync(starterProducts, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        foreach (var product in starterProducts)
        {
            await _context.BranchProducts.AddAsync(new BranchProduct
            {
                TenantId = tenant.Id,
                BranchId = branch.Id,
                ProductId = product.Id,
                IsAvailable = true
            }, cancellationToken);

            await _context.ProductModifierGroups.AddAsync(new ProductModifierGroup
            {
                ProductId = product.Id,
                ModifierGroupId = modGroup.Id
            }, cancellationToken);
        }

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = normalizedCommand.AdminEmail,
            FullName = normalizedCommand.AdminFullName.Trim(),
            Phone = normalizedCommand.ContactPhone.Trim(),
            PasswordHash = _passwordHasher.Hash(normalizedCommand.AdminPassword),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _context.Users.AddAsync(adminUser, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _context.UserRoles.AddAsync(new UserRole
        {
            UserId = adminUser.Id,
            RoleId = Role.TenantAdmin,
            BranchId = branch.Id
        }, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new CreatedTenantDto(
            tenant.Id,
            tenant.Slug,
            tenant.Name,
            tenant.BusinessName,
            tenant.TaxId,
            tenant.BrandPrimaryColor ?? "#E4002B",
            tenant.IsActive,
            adminUser.Email,
            branch.Id
        ));
    }
}
