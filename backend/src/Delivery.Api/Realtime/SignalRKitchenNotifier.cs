using Delivery.Api.Hubs;
using Delivery.Core.Contracts;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace Delivery.Api.Realtime;

public sealed class SignalRKitchenNotifier : IKitchenNotifier
{
    private readonly IHubContext<KitchenHub, IKitchenClient> _hubContext;

    public SignalRKitchenNotifier(IHubContext<KitchenHub, IKitchenClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyNewOrderAsync(int branchId, KitchenOrderTicketDto ticket, CancellationToken ct = default)
    {
        return _hubContext.Clients.Group($"kitchen_branch_{branchId}").ReceiveNewOrder(ticket);
    }

    public Task NotifyStockUpdatedAsync(int productId, bool isAvailable, CancellationToken ct = default)
    {
        return _hubContext.Clients.All.StockUpdated(productId, isAvailable);
    }

    public Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus status, CancellationToken ct = default)
    {
        return _hubContext.Clients.All.OrderStatusChanged(orderId.ToString(), status.ToString());
    }
}

