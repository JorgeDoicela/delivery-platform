using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Orders.UpdateOrderStatus;

public sealed record UpdateOrderStatusCommand(
    Guid OrderId,
    OrderStatus NewStatus,
    string? Reason = null
);

public sealed record UpdateOrderStatusResponse(
    Guid OrderId,
    OrderStatus PreviousStatus,
    OrderStatus CurrentStatus,
    DateTime UpdatedAt
);

public static class UpdateOrderStatusErrors
{
    public static readonly Error OrderNotFound = new(
        "Orders.NotFound",
        "La orden especificada no fue encontrada."
    );

    public static readonly Error InvalidTransition = new(
        "Orders.InvalidTransition",
        "La transición de estado solicitada no es válida según el ciclo de vida del pedido."
    );
}

public sealed class UpdateOrderStatusHandler
{
    private readonly AppDbContext _context;

    public UpdateOrderStatusHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UpdateOrderStatusResponse>> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == command.OrderId, cancellationToken);

        if (order is null)
        {
            return Result.Failure<UpdateOrderStatusResponse>(UpdateOrderStatusErrors.OrderNotFound);
        }

        var previousStatus = order.Status;

        // Validación estricta de la máquina de estados según README Sección 3
        var isValid = (previousStatus, command.NewStatus) switch
        {
            (OrderStatus.Created, OrderStatus.Confirmed) => true,
            (OrderStatus.Created, OrderStatus.PendingValidation) => true,
            (OrderStatus.Created, OrderStatus.Cancelled) => true,

            (OrderStatus.PendingValidation, OrderStatus.Confirmed) => true,
            (OrderStatus.PendingValidation, OrderStatus.Cancelled) => true,

            (OrderStatus.Confirmed, OrderStatus.InKitchen) => true,
            (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,

            (OrderStatus.InKitchen, OrderStatus.ReadyForDelivery) => true,
            (OrderStatus.ReadyForDelivery, OrderStatus.OnTheWay) => true,
            (OrderStatus.OnTheWay, OrderStatus.Delivered) => true,

            _ => false
        };

        if (!isValid)
        {
            return Result.Failure<UpdateOrderStatusResponse>(UpdateOrderStatusErrors.InvalidTransition);
        }

        order.Status = command.NewStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new UpdateOrderStatusResponse(
            order.Id,
            previousStatus,
            order.Status,
            order.UpdatedAt.Value
        ));
    }
}
