using Delivery.Core.Common;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features;
using Delivery.Features.Branches.GetBranchCapacity;
using Delivery.Features.Branches.ResolveBranch;
using Delivery.Features.Catalog.GetActiveMenu;
using Delivery.Features.Catalog.ToggleProductStatus;
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
        registeredServiceTypes.Should().Contain(typeof(GetActiveKitchenOrdersHandler));
        registeredServiceTypes.Should().Contain(typeof(CreateOrderHandler));
        registeredServiceTypes.Should().Contain(typeof(GetOrderByIdHandler));
        registeredServiceTypes.Should().Contain(typeof(UpdateOrderStatusHandler));
        registeredServiceTypes.Should().Contain(typeof(ApproveTransferOrderHandler));
        registeredServiceTypes.Should().Contain(typeof(IngestDriverLocationHandler));
        registeredServiceTypes.Should().Contain(typeof(GetDriverLocationHandler));

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

        // Assert: Deben registrarse exactamente 11 endpoints autónomos
        var endpointDescriptors = services.Where(s => s.ServiceType == typeof(IEndpoint)).ToList();
        endpointDescriptors.Should().HaveCount(11);

        var endpointImplementationTypes = endpointDescriptors.Select(d => d.ImplementationType).ToHashSet();
        endpointImplementationTypes.Should().Contain(typeof(ResolveBranchEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetBranchCapacityEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetActiveMenuEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(ToggleProductStatusEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetActiveKitchenOrdersEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(CreateOrderEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetOrderByIdEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(UpdateOrderStatusEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(ApproveTransferOrderEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(IngestDriverLocationEndpoint));
        endpointImplementationTypes.Should().Contain(typeof(GetDriverLocationEndpoint));
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
