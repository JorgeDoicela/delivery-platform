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
    string AdminPassword
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

    public async Task<Result<CreatedTenantDto>> Handle(CreateTenantCommand command, CancellationToken cancellationToken = default)
    {
        var normalizedCommand = command with
        {
            Slug = command.Slug.Trim().ToLowerInvariant(),
            AdminEmail = command.AdminEmail.Trim().ToLowerInvariant()
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
                ImageUrl = "/images/banners/hero-pollo-brasa.jpg",
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
                ImageUrl = "/images/banners/promo-receta-tradicional.jpg",
                ThemeVariant = "dark",
                DisplayOrder = 1,
                IsActive = true
            }
        };

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
            LogoUrl = "/images/identidad/logo.png",
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
            IsActive = true
        };

        await _context.Branches.AddAsync(branch, cancellationToken);

        var starterCategory = new Category
        {
            TenantId = tenant.Id,
            Name = "Especialidades de la Casa",
            DisplayOrder = 1,
            IsActive = true
        };
        await _context.Categories.AddAsync(starterCategory, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var starterProduct = new Product
        {
            TenantId = tenant.Id,
            CategoryId = starterCategory.Id,
            Sku = $"{normalizedCommand.Slug.ToUpperInvariant()}-001",
            Name = $"Combo Especial {tenant.Name}",
            Description = "Especialidad principal de la casa acompañada de guarniciones frescas y bebida.",
            BasePrice = 12.99m,
            TaxRate = 15.00m,
            ImageUrl = "/images/menu/1.png",
            Category = starterCategory.Name,
            IsKitchen = true,
            IsActive = true
        };
        await _context.Products.AddAsync(starterProduct, cancellationToken);

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
