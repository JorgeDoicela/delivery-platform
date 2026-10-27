using Microsoft.AspNetCore.SignalR;

namespace Delivery.Api.Hubs;

public interface ITrackingClient
{
    Task ReceiveDriverLocation(double latitude, double longitude, double? heading);
    Task OrderStatusChanged(string status);
}

public class TrackingHub : Hub<ITrackingClient>
{
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
