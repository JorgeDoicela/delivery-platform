using Delivery.Core.Contracts;
using Microsoft.AspNetCore.SignalR;

namespace Delivery.Api.Hubs;

public interface IKitchenClient
{
    Task ReceiveNewOrder(KitchenOrderTicketDto ticket);
    Task StockUpdated(int productId, bool isAvailable);
    Task OrderStatusChanged(string orderId, string status);
}

public class KitchenHub : Hub<IKitchenClient>
{
    /// <summary>
    /// Une la terminal del KDS de cocina al grupo de su respectiva sucursal.
    /// </summary>
    public async Task JoinBranchKitchen(int branchId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"kitchen_branch_{branchId}");
    }

    /// <summary>
    /// Abandona el grupo de cocina al cerrar turno.
    /// </summary>
    public async Task LeaveBranchKitchen(int branchId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"kitchen_branch_{branchId}");
    }
}
