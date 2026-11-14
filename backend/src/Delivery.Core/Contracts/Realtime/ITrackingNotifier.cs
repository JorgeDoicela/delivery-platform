using Delivery.Core.Domain.Enums;

namespace Delivery.Core.Contracts.Realtime;

public interface ITrackingNotifier
{
    Task NotifyDriverLocationAsync(Guid orderId, double latitude, double longitude, double? heading, CancellationToken ct = default);
    Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus status, CancellationToken ct = default);
    Task NotifyUserOrdersChangedAsync(Guid userId, Guid? orderId = null, CancellationToken ct = default);
    Task NotifyCustomerLocationUpdatedAsync(Guid orderId, double latitude, double longitude, bool isLive, CancellationToken ct = default);
}

