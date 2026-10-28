using Delivery.Api.Hubs;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace Delivery.Api.Realtime;

public sealed class SignalRTrackingNotifier : ITrackingNotifier
{
    private readonly IHubContext<TrackingHub, ITrackingClient> _hubContext;

    public SignalRTrackingNotifier(IHubContext<TrackingHub, ITrackingClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyDriverLocationAsync(Guid orderId, double latitude, double longitude, double? heading, CancellationToken ct = default)
    {
        return _hubContext.Clients.Group($"order_tracking_{orderId}")
            .ReceiveDriverLocation(latitude, longitude, heading);
    }

    public Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus status, CancellationToken ct = default)
    {
        return _hubContext.Clients.Group($"order_tracking_{orderId}")
            .OrderStatusChanged(status.ToString());
    }
}

