using Delivery.Features.Catalog.GetActiveMenu;
using Delivery.Features.Catalog.ToggleProductStatus;
using Delivery.Features.Geofencing.ResolveBranchByPoint;
using Delivery.Features.Kitchen.GetActiveKitchenOrders;
using Delivery.Features.Orders.ApproveTransferOrder;
using Delivery.Features.Orders.CreateOrder;
using Delivery.Features.Orders.GetOrderById;
using Delivery.Features.Orders.UpdateOrderStatus;
using Delivery.Features.Tracking.GetDriverLocation;
using Delivery.Features.Tracking.IngestDriverLocation;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Delivery.Features;

public static class DependencyInjection
{
    public static IServiceCollection AddDeliveryFeatures(this IServiceCollection services)
    {
        // Registro de Validadores FluentValidation
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Registro de Handlers de Casos de Uso (Vertical Slices)
        services.AddScoped<ResolveBranchHandler>();
        services.AddScoped<GetActiveMenuHandler>();
        services.AddScoped<ToggleProductStatusHandler>();
        services.AddScoped<CreateOrderHandler>();
        services.AddScoped<UpdateOrderStatusHandler>();
        services.AddScoped<GetOrderByIdHandler>();
        services.AddScoped<ApproveTransferOrderHandler>();
        services.AddScoped<GetActiveKitchenOrdersHandler>();
        services.AddScoped<IngestDriverLocationHandler>();
        services.AddScoped<GetDriverLocationHandler>();
        services.AddScoped<Delivery.Features.Orders.GetBranchCapacity.GetBranchCapacityHandler>();

        return services;
    }
}
