using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Delivery.Api.Hubs;

public interface ITrackingClient
{
    Task ReceiveDriverLocation(double latitude, double longitude, double? heading);
    Task OrderStatusChanged(string status);
    Task OrdersListUpdated(string? orderId = null);
    Task CustomerLocationUpdated(string orderId, double latitude, double longitude, bool isLive);
}

public class TrackingHub : Hub<ITrackingClient>
{
    /// <summary>
    /// Une al cliente al canal exclusivo de sus pedidos para recibir actualizaciones en tiempo real.
    /// </summary>
    public async Task JoinUserTracking(string userId)
    {
        if (!string.IsNullOrWhiteSpace(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_orders_{userId.Trim()}");
        }
    }

    /// <summary>
    /// Abandona el canal de pedidos del usuario.
    /// </summary>
    public async Task LeaveUserTracking(string userId)
    {
        if (!string.IsNullOrWhiteSpace(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_orders_{userId.Trim()}");
        }
    }

    /// <summary>
    /// Une al cliente al canal exclusivo de rastreo de su orden activa.
    /// </summary>
    public async Task JoinOrderTracking(string orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order_tracking_{orderId}");
    }

    /// <summary>
    /// El repartidor transmite sus coordenadas GPS en vivo hacia los clientes de la orden.
    /// </summary>
    [Authorize(Policy = "DriverOnly")]
    public async Task SendDriverLocation(string orderId, double latitude, double longitude, double? heading)
    {
        await Clients.Group($"order_tracking_{orderId}").ReceiveDriverLocation(latitude, longitude, heading);
    }

    /// <summary>
    /// Abandona el grupo de rastreo al completarse la entrega.
    /// </summary>
    public async Task LeaveOrderTracking(string orderId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order_tracking_{orderId}");
    }
}
