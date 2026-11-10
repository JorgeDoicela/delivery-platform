using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Account.GetMyOrders;

public sealed record AccountOrderItemDto(
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public sealed record AccountOrderSummaryDto(
    Guid OrderId,
    int OrderNumber,
    string TenantSlug,
    string TenantName,
    int BranchId,
    string BranchName,
    OrderStatus Status,
    string StatusText,
    decimal Total,
    decimal Subtotal,
    decimal DeliveryFee,
    int ItemsCount,
    string AddressStreet,
    DateTime CreatedAt,
    bool IsActive,
    List<AccountOrderItemDto> Items
);

public sealed record GetMyOrdersResponse(
    List<AccountOrderSummaryDto> Orders,
    int TotalCount,
    int Page,
    int PageSize
);

public sealed record GetMyOrdersQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 10,
    string? StatusFilter = null
);

public sealed class GetMyOrdersHandler : IHandler<GetMyOrdersQuery, Result<GetMyOrdersResponse>>
{
    private readonly AppDbContext _context;

    private static readonly OrderStatus[] ActiveStatuses =
    [
        OrderStatus.Created,
        OrderStatus.PendingValidation,
        OrderStatus.Confirmed,
        OrderStatus.InKitchen,
        OrderStatus.ReadyForDelivery,
        OrderStatus.OnTheWay
    ];

    public GetMyOrdersHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<GetMyOrdersResponse>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<GetMyOrdersResponse>(AccountErrors.UserNotFound);
        }

        var normalizedEmail = user.Email.Trim().ToLowerInvariant();

        // Consulta de órdenes vinculadas al email del cliente autenticado
        var query = _context.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(o => o.CustomerEmail != null && o.CustomerEmail.ToLower() == normalizedEmail);

        // Si hay tenant seleccionado en el contexto de la petición, se restringe a dicho tenant
        if (_context.CurrentTenantId.HasValue)
        {
            query = query.Where(o => o.TenantId == _context.CurrentTenantId.Value);
        }

        // Filtro por estado activo vs completado/cancelado
        if (!string.IsNullOrWhiteSpace(request.StatusFilter))
        {
            var filter = request.StatusFilter.Trim().ToLowerInvariant();
            if (filter == "active" || filter == "activos")
            {
                query = query.Where(o => ActiveStatuses.Contains(o.Status));
            }
            else if (filter == "delivered" || filter == "entregados")
            {
                query = query.Where(o => o.Status == OrderStatus.Delivered);
            }
            else if (filter == "cancelled" || filter == "cancelados")
            {
                query = query.Where(o => o.Status == OrderStatus.Cancelled);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new AccountOrderSummaryDto(
                o.Id,
                o.OrderNumber,
                o.Tenant.Slug,
                o.Tenant.Name,
                o.BranchId,
                o.Branch.Name,
                o.Status,
                GetStatusLabel(o.Status),
                o.Total,
                o.Subtotal,
                o.DeliveryFee,
                o.Items.Count,
                o.AddressStreet,
                o.CreatedAt,
                ActiveStatuses.Contains(o.Status),
                o.Items.Select(i => new AccountOrderItemDto(
                    i.ProductNameSnapshot,
                    i.Quantity,
                    i.UnitPriceSnapshot,
                    i.UnitPriceSnapshot * i.Quantity
                )).ToList()
            ))
            .ToListAsync(cancellationToken);

        return Result.Success(new GetMyOrdersResponse(orders, totalCount, page, pageSize));
    }

    private static string GetStatusLabel(OrderStatus status) => status switch
    {
        OrderStatus.Created => "Recibida",
        OrderStatus.PendingValidation => "Validando Pago",
        OrderStatus.Confirmed => "Confirmada",
        OrderStatus.InKitchen => "En Preparación",
        OrderStatus.ReadyForDelivery => "Lista para Despacho",
        OrderStatus.OnTheWay => "En Camino",
        OrderStatus.Delivered => "Entregada",
        OrderStatus.Cancelled => "Cancelada",
        _ => status.ToString()
    };
}
