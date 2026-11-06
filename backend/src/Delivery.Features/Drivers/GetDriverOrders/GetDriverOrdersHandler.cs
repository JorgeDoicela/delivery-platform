using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Drivers.GetDriverOrders;

public static class GetDriverOrdersErrors
{
    public static readonly Error DriverNotFound = new(
        "Drivers.NotFound",
        "No se encontró un perfil de repartidor activo para el usuario actual."
    );
}

public sealed record GetDriverOrdersQuery(Guid UserId, int? BranchId = null);

public sealed record DriverOrderItemDto(
    string ProductName,
    int Quantity,
    List<string> Modifiers
);

public sealed record DriverOrderDto(
    Guid OrderId,
    int OrderNumber,
    string CustomerName,
    string CustomerPhone,
    string AddressStreet,
    string AddressReference,
    double? DeliveryLatitude,
    double? DeliveryLongitude,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    PaymentMethod PaymentMethod,
    decimal? CashAmountPaid,
    decimal? ChangeDue,
    OrderStatus Status,
    DateTime CreatedAt,
    DateTime? AssignedAt,
    DateTime? PickedUpAt,
    DateTime? DeliveredAt,
    string? CustomerNotes,
    string BranchName,
    List<DriverOrderItemDto> Items
);

public sealed record DriverShiftSummaryDto(
    int CompletedCount,
    decimal CashCollected,
    decimal TotalEarnings
);

public sealed record DriverOrdersResponse(
    List<DriverOrderDto> ActiveOrders,
    List<DriverOrderDto> AvailableOrders,
    List<DriverOrderDto> DeliveredToday,
    DriverShiftSummaryDto ShiftSummary
);

public sealed class GetDriverOrdersHandler : IHandler<GetDriverOrdersQuery, Result<DriverOrdersResponse>>
{
    private readonly AppDbContext _context;

    public GetDriverOrdersHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DriverOrdersResponse>> Handle(GetDriverOrdersQuery query, CancellationToken cancellationToken = default)
    {
        // 1. Resolver identidad del motorizado
        var driver = await _context.Drivers
            .AsNoTracking()
            .Include(d => d.User)
                .ThenInclude(u => u.UserRoles)
            .FirstOrDefaultAsync(d => d.UserId == query.UserId, cancellationToken);

        if (driver is null)
        {
            return Result.Failure<DriverOrdersResponse>(GetDriverOrdersErrors.DriverNotFound);
        }

        // Determinar sucursal operativa del motorizado
        var branchId = query.BranchId
            ?? driver.User.UserRoles.FirstOrDefault(ur => ur.RoleId == Role.Driver && ur.BranchId.HasValue)?.BranchId
            ?? driver.User.UserRoles.FirstOrDefault(ur => ur.BranchId.HasValue)?.BranchId;

        // 2. Pedidos activos asignados al motorizado en curso (OnTheWay)
        var activeDeliveries = await _context.OrderDeliveries
            .AsNoTracking()
            .Where(od => od.DriverId == driver.Id && od.Order.Status == OrderStatus.OnTheWay)
            .Include(od => od.Order)
                .ThenInclude(o => o.Branch)
            .Include(od => od.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
            .OrderBy(od => od.AssignedAt)
            .ToListAsync(cancellationToken);

        var activeOrders = activeDeliveries.Select(od => MapToDto(od.Order, od.AssignedAt, od.PickedUpAt, od.DeliveredAt)).ToList();

        // 3. Pedidos listos en cocina de la sucursal disponibles para ser tomados (ReadyForDelivery)
        var availableOrdersQuery = _context.Orders
            .AsNoTracking()
            .Where(o => o.DeliveryType == DeliveryType.Delivery
                        && o.Status == OrderStatus.ReadyForDelivery
                        && !_context.OrderDeliveries.Any(od => od.OrderId == o.Id && od.Order.Status == OrderStatus.OnTheWay));

        if (branchId.HasValue)
        {
            availableOrdersQuery = availableOrdersQuery.Where(o => o.BranchId == branchId.Value);
        }

        var availableEntities = await availableOrdersQuery
            .Include(o => o.Branch)
            .Include(o => o.Items)
                .ThenInclude(i => i.Modifiers)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var availableOrders = availableEntities.Select(o => MapToDto(o, null, null, null)).ToList();

        // 4. Pedidos entregados hoy por este motorizado (Delivered)
        var todayStartUtc = DateTime.UtcNow.Date;
        var deliveredTodayDeliveries = await _context.OrderDeliveries
            .AsNoTracking()
            .Where(od => od.DriverId == driver.Id
                         && od.Order.Status == OrderStatus.Delivered
                         && ((od.DeliveredAt.HasValue && od.DeliveredAt.Value >= todayStartUtc)
                             || (od.Order.UpdatedAt.HasValue && od.Order.UpdatedAt.Value >= todayStartUtc)))
            .Include(od => od.Order)
                .ThenInclude(o => o.Branch)
            .Include(od => od.Order)
                .ThenInclude(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
            .OrderByDescending(od => od.DeliveredAt ?? od.Order.UpdatedAt)
            .ToListAsync(cancellationToken);

        var deliveredToday = deliveredTodayDeliveries.Select(od => MapToDto(od.Order, od.AssignedAt, od.PickedUpAt, od.DeliveredAt)).ToList();

        // 5. Cálculo del resumen de turno
        var cashCollected = deliveredToday
            .Where(o => o.PaymentMethod is PaymentMethod.CashOnDelivery)
            .Sum(o => o.Total);

        var shiftSummary = new DriverShiftSummaryDto(
            CompletedCount: deliveredToday.Count,
            CashCollected: cashCollected,
            TotalEarnings: deliveredToday.Sum(o => o.DeliveryFee) // Ganancia estimada por fletes
        );

        return Result.Success(new DriverOrdersResponse(
            ActiveOrders: activeOrders,
            AvailableOrders: availableOrders,
            DeliveredToday: deliveredToday,
            ShiftSummary: shiftSummary
        ));
    }

    private static DriverOrderDto MapToDto(
        Order o,
        DateTime? assignedAt,
        DateTime? pickedUpAt,
        DateTime? deliveredAt)
    {
        return new DriverOrderDto(
            OrderId: o.Id,
            OrderNumber: o.OrderNumber,
            CustomerName: o.CustomerName,
            CustomerPhone: o.CustomerPhone,
            AddressStreet: o.AddressStreet,
            AddressReference: o.AddressReference,
            DeliveryLatitude: o.DeliveryLocation?.Y,
            DeliveryLongitude: o.DeliveryLocation?.X,
            Subtotal: o.Subtotal,
            DeliveryFee: o.DeliveryFee,
            Total: o.Total,
            PaymentMethod: o.PaymentMethod,
            CashAmountPaid: o.CashAmountPaid,
            ChangeDue: o.ChangeDue,
            Status: o.Status,
            CreatedAt: o.CreatedAt,
            AssignedAt: assignedAt,
            PickedUpAt: pickedUpAt,
            DeliveredAt: deliveredAt,
            CustomerNotes: o.CustomerNotes,
            BranchName: o.Branch?.Name ?? "Sucursal Principal",
            Items: o.Items.Select(i => new DriverOrderItemDto(
                ProductName: i.ProductNameSnapshot,
                Quantity: i.Quantity,
                Modifiers: i.Modifiers.Select(m => m.ModifierNameSnapshot).ToList()
            )).ToList()
        );
    }
}
