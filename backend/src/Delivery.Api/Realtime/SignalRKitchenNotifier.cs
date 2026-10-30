using Delivery.Api.Hubs;
using Delivery.Core.Contracts;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Api.Realtime;

public sealed class SignalRKitchenNotifier : IKitchenNotifier
{
    private readonly IHubContext<KitchenHub, IKitchenClient> _hubContext;
    private readonly ITenantContext _tenantContext;
    private readonly AppDbContext _dbContext;

    public SignalRKitchenNotifier(
        IHubContext<KitchenHub, IKitchenClient> hubContext,
        ITenantContext tenantContext,
        AppDbContext dbContext)
    {
        _hubContext = hubContext;
        _tenantContext = tenantContext;
        _dbContext = dbContext;
    }

    public Task NotifyNewOrderAsync(int branchId, KitchenOrderTicketDto ticket, CancellationToken ct = default)
    {
        return _hubContext.Clients.Group($"kitchen_branch_{branchId}").ReceiveNewOrder(ticket);
    }

    public async Task NotifyStockUpdatedAsync(int productId, bool isAvailable, CancellationToken ct = default)
    {
        var targetGroups = await ResolveTenantGroupNamesAsync(ct);
        if (targetGroups.Count > 0)
        {
            await _hubContext.Clients.Groups(targetGroups).StockUpdated(productId, isAvailable);
        }
    }

    public async Task NotifyOrderStatusChangedAsync(Guid orderId, OrderStatus status, CancellationToken ct = default)
    {
        var targetGroups = await ResolveTenantGroupNamesAsync(ct);
        if (targetGroups.Count > 0)
        {
            await _hubContext.Clients.Groups(targetGroups).OrderStatusChanged(orderId.ToString(), status.ToString());
        }
    }

    private async Task<List<string>> ResolveTenantGroupNamesAsync(CancellationToken ct)
    {
        var groups = new List<string>();

        if (!string.IsNullOrWhiteSpace(_tenantContext.TenantSlug))
        {
            groups.Add($"kitchen_tenant_{_tenantContext.TenantSlug.ToLowerInvariant()}");
        }

        if (_tenantContext.TenantId.HasValue)
        {
            var branchIds = await _dbContext.Branches
                .AsNoTracking()
                .Where(b => b.TenantId == _tenantContext.TenantId.Value)
                .Select(b => b.Id)
                .ToListAsync(ct);

            groups.AddRange(branchIds.Select(id => $"kitchen_branch_{id}"));
        }

        return groups;
    }
}
