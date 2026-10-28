using Delivery.Core.Domain.Enums;

namespace Delivery.Core.Contracts.Realtime;

public interface ITrackingNotifier
{
    Task NotifyDriverLocationAsync(Guid orderId, double latitude, double longitude, double? heading, CancellationToken ct = default);
    Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus status, CancellationToken ct = default);
}

