using Delivery.Core.Contracts;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Api.Hubs;

public interface IKitchenClient
{
    Task ReceiveNewOrder(KitchenOrderTicketDto ticket);
    Task StockUpdated(int productId, bool isAvailable);
    Task OrderStatusChanged(string orderId, string status);
    Task CustomerLocationUpdated(string orderId, double latitude, double longitude, bool isLive);
}

[Authorize(Policy = "OperationalStaffOnly")]
public class KitchenHub : Hub<IKitchenClient>
{
    private readonly AppDbContext _context;

    public KitchenHub(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Une la terminal del KDS de cocina o repartidor al grupo de su respectiva sucursal.
    /// Valida que la sucursal pertenezca al TenantId del usuario autenticado.
    /// </summary>
    public async Task JoinBranchKitchen(int branchId)
    {
        var tenantIdClaim = Context.User?.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantIdClaim, out var tenantId))
        {
            var branchBelongsToTenant = await _context.Branches
                .IgnoreQueryFilters()
                .AnyAsync(b => b.Id == branchId && b.TenantId == tenantId);

            if (!branchBelongsToTenant)
            {
                return;
            }
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"kitchen_branch_{branchId}");
    }

    /// <summary>
    /// Abandona el grupo de cocina al cerrar turno o cambiar de sucursal.
    /// </summary>
    public async Task LeaveBranchKitchen(int branchId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"kitchen_branch_{branchId}");
    }

    /// <summary>
    /// Une al cliente al canal de eventos de stock, catálogo y órdenes de un tenant específico.
    /// Valida que el slug corresponda al tenant asignado al usuario en su token JWT.
    /// </summary>
    public async Task JoinTenantChannel(string tenantSlug)
    {
        if (string.IsNullOrWhiteSpace(tenantSlug)) return;

        var normalizedSlug = tenantSlug.Trim().ToLowerInvariant();
        var tenantIdClaim = Context.User?.FindFirst("tenant_id")?.Value;

        if (Guid.TryParse(tenantIdClaim, out var tenantId))
        {
            var tenantMatches = await _context.Tenants
                .IgnoreQueryFilters()
                .AnyAsync(t => t.Id == tenantId && t.Slug == normalizedSlug && t.IsActive);

            if (!tenantMatches)
            {
                return;
            }
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"kitchen_tenant_{normalizedSlug}");
    }

    public async Task LeaveTenantChannel(string tenantSlug)
    {
        if (!string.IsNullOrWhiteSpace(tenantSlug))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"kitchen_tenant_{tenantSlug.Trim().ToLowerInvariant()}");
        }
    }
}
