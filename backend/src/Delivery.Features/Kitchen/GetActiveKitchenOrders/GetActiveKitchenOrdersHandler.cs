using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Kitchen.GetActiveKitchenOrders;

public sealed record GetActiveKitchenOrdersQuery(int BranchId);

public sealed record KitchenTicketModifierDto(string ModifierName);

public sealed record KitchenTicketItemDto(
    string ProductName,
    int Quantity,
    List<KitchenTicketModifierDto> Modifiers
);

public sealed record KitchenOrderTicketDto(
    Guid OrderId,
    string CustomerName,
    DeliveryType DeliveryType,
    OrderStatus Status,
    string AddressStreet,
    string AddressReference,
    DateTime CreatedAt,
    List<KitchenTicketItemDto> Items
);

public sealed class GetActiveKitchenOrdersHandler
{
    private readonly AppDbContext _context;

    public GetActiveKitchenOrdersHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<KitchenOrderTicketDto>>> Handle(GetActiveKitchenOrdersQuery query, CancellationToken cancellationToken = default)
    {
        var activeStatuses = new[]
        {
            OrderStatus.Confirmed,
            OrderStatus.InKitchen,
            OrderStatus.ReadyForDelivery
        };

        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.BranchId == query.BranchId && activeStatuses.Contains(o.Status))
            .OrderBy(o => o.CreatedAt) // FIFO: Primero en entrar, primero en salir
            .Include(o => o.Items)
                .ThenInclude(i => i.Modifiers)
            .ToListAsync(cancellationToken);

        var tickets = orders.Select(o => new KitchenOrderTicketDto(
            o.Id,
            o.CustomerName,
            o.DeliveryType,
            o.Status,
            o.AddressStreet,
            o.AddressReference,
            o.CreatedAt,
            o.Items.Select(i => new KitchenTicketItemDto(
                i.ProductNameSnapshot,
                i.Quantity,
                i.Modifiers.Select(m => new KitchenTicketModifierDto(m.ModifierNameSnapshot)).ToList()
            )).ToList()
        )).ToList();

        return Result.Success(tickets);
    }
}
