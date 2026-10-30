using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.ValueObjects;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Branches.GetBranches;
using Delivery.Features.Common.Security;
using Delivery.Features.Tenants.CreateTenant;
using Delivery.Features.Tenants.GetCurrentTenant;
using Delivery.Features.Tenants.GetPlatformTenants;
using Delivery.Features.Tenants.GetPublicTenants;
using Delivery.Features.Tenants.ToggleTenantStatus;
using Delivery.Features.Tenants.UpdateTenantStorefront;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Delivery.UnitTests.Features;

public class TenantStorefrontHandlersTests
{
    private sealed class FakeTenantContext : ITenantContext
    {
        public Guid? TenantId { get; set; }
        public string? TenantSlug { get; set; }
        public bool IsResolved => TenantId.HasValue;
    }

    private static DbContextOptions<AppDbContext> CreateOptions(string dbName)
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
    }

    [Fact]
    public async Task GetPublicTenantsHandler_ShouldReturnAllActiveTenantsWithBrandColorsAndBranchCounts()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(context);

        var handler = new GetPublicTenantsHandler(context);
        var result = await handler.Handle(new GetPublicTenantsQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Tenants.Should().HaveCount(3);
        result.Value.Tenants.Select(t => t.Slug).Should().Contain("la-granjita");
        result.Value.Tenants.Select(t => t.Slug).Should().Contain("brasas-del-valle");
        result.Value.Tenants.Select(t => t.Slug).Should().Contain("el-lenador");
    }

    [Fact]
    public async Task GetCurrentTenantHandler_ShouldReturnIsolatedStorefrontConfigForResolvedTenant()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var setupContext = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(setupContext);

        var brasas = await setupContext.Tenants.FirstAsync(t => t.Slug == "brasas-del-valle");
        var tenantCtx = new FakeTenantContext
        {
            TenantId = brasas.Id,
            TenantSlug = brasas.Slug
        };

        await using var scopedContext = new AppDbContext(CreateOptions(dbName), tenantCtx);
        var handler = new GetCurrentTenantHandler(scopedContext, tenantCtx);

        var result = await handler.Handle(new GetCurrentTenantQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Slug.Should().Be("brasas-del-valle");
        result.Value.Name.Should().Be("Brasas del Valle");
        result.Value.BrandPrimaryColor.Should().Be("#047857");
        result.Value.BaseDeliveryFee.Should().Be(2.00m);
        result.Value.HeroSlides.Should().NotBeEmpty();
        result.Value.PromotionalBanners.Should().NotBeEmpty();
        result.Value.Branches.Should().HaveCount(1);
    }

    [Fact]
    public async Task UpdateTenantStorefrontHandler_ShouldPersistCustomLandingAndBrandingForActiveTenant()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var setupContext = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(setupContext);

        var lenador = await setupContext.Tenants.FirstAsync(t => t.Slug == "el-lenador");
        var tenantCtx = new FakeTenantContext
        {
            TenantId = lenador.Id,
            TenantSlug = lenador.Slug
        };

        await using var scopedContext = new AppDbContext(CreateOptions(dbName), tenantCtx);
        var validator = new UpdateTenantStorefrontValidator();
        var handler = new UpdateTenantStorefrontHandler(scopedContext, tenantCtx, validator);

        var command = new UpdateTenantStorefrontCommand(
            Name: "El Leñador Ahumados Premium",
            Tagline: "Ahumador Artesanal",
            Description: "Costillas San Luis ahumadas durante 8 horas en leña seleccionada.",
            HeroSubtitle: "Elige tus salsas y guarniciones al fuego",
            BusinessName: "Ahumados El Leñador Cia. Ltda.",
            TaxId: "1794500800001",
            LogoUrl: "/images/identidad/logo.png",
            BrandPrimaryColor: "#D97706",
            BrandPrimaryHoverColor: "#B45309",
            BrandAccentColor: "#F59E0B",
            ContactPhone: "0991112233",
            ContactEmail: "contacto@ellenador.com",
            BaseDeliveryFee: 2.25m,
            EnableDelivery: true,
            EnableTakeout: true,
            EnableDineIn: false,
            AcceptsCash: true,
            AcceptsBankTransfer: true,
            AcceptsCard: true,
            QuickLinksEnabled: false,
            BankDetails: new UpdateTenantBankDetailsDto(
                "Banco Produbanco",
                "Cuenta Corriente",
                "1200987654",
                "Ahumados El Leñador Cia. Ltda.",
                "1794500800001"
            ),
            HeroSlides: new List<TenantHeroSlide>
            {
                new()
                {
                    Id = "custom-slide-1",
                    Badge = "Edición Especial",
                    Title = "FESTIVAL DEL COSTILLAR AHUMADO",
                    Subtitle = "Doble porción de costillas con papas cuña.",
                    CtaText = "PEDIR AHORA",
                    CtaHref = "/catalogo",
                    ImageUrl = "/images/banners/hero-combo-personal.jpg",
                    DisplayOrder = 1,
                    IsActive = true
                }
            },
            PromotionalBanners: new List<TenantPromoBanner>()
        );

        var result = await handler.Handle(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("El Leñador Ahumados Premium");
        result.Value.BrandPrimaryColor.Should().Be("#D97706");
        result.Value.BaseDeliveryFee.Should().Be(2.25m);
        result.Value.QuickLinksEnabled.Should().BeFalse();
        result.Value.HeroSlides.Should().ContainSingle(s => s.Title == "FESTIVAL DEL COSTILLAR AHUMADO");
    }

    [Fact]
    public async Task GetBranchesHandler_ShouldReturnOnlyBranchesBelongingToCurrentTenant()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var setupContext = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(setupContext);

        var laGranjita = await setupContext.Tenants.FirstAsync(t => t.Slug == "la-granjita");
        var brasas = await setupContext.Tenants.FirstAsync(t => t.Slug == "brasas-del-valle");

        await using (var granjitaCtx = new AppDbContext(CreateOptions(dbName), new FakeTenantContext { TenantId = laGranjita.Id }))
        {
            var handler = new GetBranchesHandler(granjitaCtx);
            var res = await handler.Handle(new GetBranchesQuery());
            res.IsSuccess.Should().BeTrue();
            res.Value.Should().HaveCount(2);
        }

        await using (var brasasCtx = new AppDbContext(CreateOptions(dbName), new FakeTenantContext { TenantId = brasas.Id }))
        {
            var handler = new GetBranchesHandler(brasasCtx);
            var res = await handler.Handle(new GetBranchesQuery());
            res.IsSuccess.Should().BeTrue();
            res.Value.Should().ContainSingle(b => b.Name.Contains("Cumbayá"));
        }
    }

    [Fact]
    public async Task CreateTenantAndToggleStatus_ShouldProvisionNewTenantAndAllowSuspendingIt()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = new AppDbContext(CreateOptions(dbName));
        await DatabaseSeeder.SeedAsync(context);

        var createHandler = new CreateTenantHandler(
            context,
            new CreateTenantValidator(),
            new BCryptPasswordHasher());

        var createCmd = new CreateTenantCommand(
            Name: "Parrilladas Don Fuego",
            Slug: "don-fuego",
            BusinessName: "Inversiones Gastronómicas Don Fuego S.A.",
            TaxId: "1795556667001",
            Tagline: "Cortes Argentinos al Carbón",
            Description: "Bife de chorizo y cortes madurados a la parrilla.",
            BrandPrimaryColor: "#991B1B",
            BrandPrimaryHoverColor: "#7F1D1D",
            BrandAccentColor: "#F59E0B",
            BaseDeliveryFee: 2.50m,
            ContactPhone: "0998887766",
            ContactEmail: "gerencia@donfuego.com",
            PrimaryBranchName: "Don Fuego - La Carolina",
            PrimaryBranchAddress: "Av. República del Salvador y Moscú",
            AdminFullName: "Martín Palermo",
            AdminEmail: "martin@donfuego.com",
            AdminPassword: "Password123!"
        );

        var createResult = await createHandler.Handle(createCmd);
        createResult.IsSuccess.Should().BeTrue();
        createResult.Value.Slug.Should().Be("don-fuego");
        createResult.Value.IsActive.Should().BeTrue();

        var platformHandler = new GetPlatformTenantsHandler(context);
        var platformResult = await platformHandler.Handle(new GetPlatformTenantsQuery());
        platformResult.IsSuccess.Should().BeTrue();
        platformResult.Value.Tenants.Should().HaveCount(4);
        platformResult.Value.Tenants.Should().Contain(t => t.Slug == "don-fuego" && t.AdminEmail == "martin@donfuego.com");

        var toggleHandler = new ToggleTenantStatusHandler(context);
        var toggleResult = await toggleHandler.Handle(new ToggleTenantStatusCommand(createResult.Value.Id, false));
        toggleResult.IsSuccess.Should().BeTrue();
        toggleResult.Value.IsActive.Should().BeFalse();

        // El directorio público solo expone los 3 tenants activos
        var publicHandler = new GetPublicTenantsHandler(context);
        var publicResult = await publicHandler.Handle(new GetPublicTenantsQuery());
        publicResult.Value.Tenants.Should().HaveCount(3);
    }
}
