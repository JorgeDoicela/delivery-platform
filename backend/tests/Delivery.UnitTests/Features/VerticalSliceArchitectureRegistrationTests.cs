using Delivery.Core.Common;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features;
using Delivery.Features.Branches.GetBranchCapacity;
using Delivery.Features.Branches.ResolveBranch;
using Delivery.Features.Catalog.GetActiveMenu;
using Delivery.Features.Catalog.GetPopularProducts;
using Delivery.Features.Catalog.ToggleProductStatus;
using Delivery.Features.Catalog.UpsertProduct;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Kitchen.GetActiveKitchenOrders;
using Delivery.Features.Orders.ApproveTransferOrder;
using Delivery.Features.Orders.CreateOrder;
using Delivery.Features.Orders.GetOrderById;
using Delivery.Features.Orders.UpdateOrderStatus;
using Delivery.Features.Tracking.GetDriverLocation;
using Delivery.Features.Tracking.IngestDriverLocation;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using StackExchange.Redis;
using Xunit;

namespace Delivery.UnitTests.Features;

public class VerticalSliceArchitectureRegistrationTests
{
    [Fact]
    public void AddDeliveryFeatures_ShouldAutoRegisterAllHandlers()
    {
        // Arrange
        var services = new ServiceCollection();

        // Act
        services.AddDeliveryFeatures();

        // Assert: Verificar que todos los handlers de los vertical slices están registrados en el contenedor
        var registeredServiceTypes = services.Select(s => s.ServiceType).ToHashSet();

        registeredServiceTypes.Should().Contain(typeof(ResolveBranchHandler));
        registeredServiceTypes.Should().Contain(typeof(GetBranchCapacityHandler));
        registeredServiceTypes.Should().Contain(typeof(GetActiveMenuHandler));
        registeredServiceTypes.Should().Contain(typeof(ToggleProductStatusHandler));
        registeredServiceTypes.Should().Contain(typeof(UpsertProductHandler));
        registeredServiceTypes.Should().Contain(typeof(GetPopularProductsHandler));
        registeredServiceTypes.Should().Contain(typeof(GetActiveKitchenOrdersHandler));
        registeredServiceTypes.Should().Contain(typeof(CreateOrderHandler));
        registeredServiceTypes.Should().Contain(typeof(GetOrderByIdHandler));
        registeredServiceTypes.Should().Contain(typeof(UpdateOrderStatusHandler));
        registeredServiceTypes.Should().Contain(typeof(ApproveTransferOrderHandler));
        registeredServiceTypes.Should().Contain(typeof(IngestDriverLocationHandler));
        registeredServiceTypes.Should().Contain(typeof(GetDriverLocationHandler));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Branches.UpdateBranchOperatingHours.UpdateBranchOperatingHoursHandler));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Emails.SendTestEmail.SendTestEmailHandler));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Auth.ForgotPassword.ForgotPasswordHandler));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Auth.ResetPassword.ResetPasswordHandler));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Auth.VerifyEmail.VerifyEmailHandler));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Auth.ResendVerification.ResendVerificationHandler));

        // Verificar registro de interfaces IHandler<,>
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Common.Handlers.IHandler<CreateOrderCommand, Result<CreateOrderResponse>>));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Common.Handlers.IHandler<ResolveBranchQuery, Result<BranchCoverageDto>>));
        registeredServiceTypes.Should().Contain(typeof(Delivery.Features.Common.Handlers.IHandler<GetOrderByIdQuery, Result<OrderDetailResponse>>));
    }

    [Fact]
    public void AddDeliveryFeatures_ShouldAutoRegisterAllVerticalSliceEndpoints()
    {
        // Arrange
        var services = new ServiceCollection();

        // Act
        services.AddDeliveryFeatures();

        // Assert: Deben registrarse exactamente 36 endpoints autónomos
        var endpointDescriptors = services.Where(s => s.ServiceType == typeof(IEndpoint)).ToList();
        endpointDescriptors.Should().HaveCount(36);

        var endpointImplementationTypes = endpointDescriptors.Select(d => d.ImplementationType).ToHashSet();
        endpointImplementationTypes.Should().Contain(typeof(ResolveBranchEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetBranchCapacityEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Branches.GetBranches.GetBranchesEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Branches.UpdateBranchOperatingHours.UpdateBranchOperatingHoursEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetActiveMenuEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(ToggleProductStatusEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(UpsertProductEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Catalog.GetPopularProducts.GetPopularProductsEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetActiveKitchenOrdersEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(CreateOrderEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetOrderByIdEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(UpdateOrderStatusEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(ApproveTransferOrderEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Tenants.GetPublicTenants.GetPublicTenantsEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Tenants.GetPlatformTenants.GetPlatformTenantsEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Tenants.CreateTenant.CreateTenantEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Tenants.ToggleTenantStatus.ToggleTenantStatusEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Tenants.GetCurrentTenant.GetCurrentTenantEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Tenants.UpdateTenantStorefront.UpdateTenantStorefrontEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(IngestDriverLocationEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetDriverLocationEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.Login.LoginEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.Register.RegisterEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.GoogleAuth.GoogleAuthEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.RefreshToken.RefreshTokenEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.GetCurrentUser.GetCurrentUserEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.RevokeToken.RevokeTokenEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Drivers.GetDriverProfile.GetDriverProfileEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Drivers.UpdateDriverStatus.UpdateDriverStatusEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Drivers.GetDriverOrders.GetDriverOrdersEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Drivers.ClaimDriverOrder.ClaimDriverOrderEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Emails.SendTestEmail.SendTestEmailEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.ForgotPassword.ForgotPasswordEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.ResetPassword.ResetPasswordEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.VerifyEmail.VerifyEmailEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(Delivery.Features.Auth.ResendVerification.ResendVerificationEndpoint));
    }

    [Fact]
    public void MapEndpoints_ShouldExecuteWithoutExceptions()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddDeliveryFeatures();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        services.AddScoped(_ => new AppDbContext(options));
        services.AddSingleton(new Mock<IConnectionMultiplexer>().Object);
        services.AddScoped(_ => new Mock<IKitchenNotifier>().Object);
        services.AddScoped(_ => new Mock<ITrackingNotifier>().Object);

        var serviceProvider = services.BuildServiceProvider();

        var mockRouteBuilder = new Mock<IEndpointRouteBuilder>();
        var dataSources = new List<EndpointDataSource>();
        mockRouteBuilder.Setup(m => m.DataSources).Returns(dataSources);
        mockRouteBuilder.Setup(m => m.ServiceProvider).Returns(serviceProvider);
        mockRouteBuilder.Setup(m => m.CreateApplicationBuilder()).Returns(new Mock<IApplicationBuilder>().Object);

        // Act & Assert
        var act = () => mockRouteBuilder.Object.MapEndpoints();
        act.Should().NotThrow();
        dataSources.Should().NotBeEmpty();
    }
}
