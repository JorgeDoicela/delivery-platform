using Delivery.Core.Domain.Enums;

namespace Delivery.Core.Contracts.Realtime;

public interface IKitchenNotifier
{
    Task NotifyNewOrderAsync(int branchId, KitchenOrderTicketDto ticket, CancellationToken ct = default);
    Task NotifyStockUpdatedAsync(int productId, bool isAvailable, CancellationToken ct = default);
    Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus status, CancellationToken ct = default);
    Task NotifyCustomerLocationUpdatedAsync(Guid orderId, int branchId, double latitude, double longitude, bool isLive, CancellationToken ct = default);
}

