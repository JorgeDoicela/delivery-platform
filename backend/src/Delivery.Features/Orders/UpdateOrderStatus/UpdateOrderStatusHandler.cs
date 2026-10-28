using Delivery.Core.Common;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
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

public sealed class UpdateOrderStatusValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("El identificador de la orden no puede ser un GUID vacío.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("El estado objetivo proporcionado no es un enumerador válido.");

        When(x => !string.IsNullOrEmpty(x.Reason), () =>
        {
            RuleFor(x => x.Reason).MaximumLength(500);
        });
    }
}

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

public sealed class UpdateOrderStatusHandler : IHandler<UpdateOrderStatusCommand, Result<UpdateOrderStatusResponse>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<UpdateOrderStatusCommand> _validator;
    private readonly ITrackingNotifier _trackingNotifier;
    private readonly IKitchenNotifier _kitchenNotifier;

    public UpdateOrderStatusHandler(
        AppDbContext context,
        IValidator<UpdateOrderStatusCommand> validator,
        ITrackingNotifier trackingNotifier,
        IKitchenNotifier kitchenNotifier)
    {
        _context = context;
        _validator = validator;
        _trackingNotifier = trackingNotifier;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<Result<UpdateOrderStatusResponse>> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<UpdateOrderStatusResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

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

        // Notificaciones en tiempo real (Canal de Tracking de cliente y Pantallas KDS de cocina)
        await _trackingNotifier.NotifyOrderStatusChangedAsync(order.Id, order.Status, cancellationToken);
        await _kitchenNotifier.NotifyOrderStatusChangedAsync(order.Id, order.Status, cancellationToken);

        return Result.Success(new UpdateOrderStatusResponse(
            order.Id,
            previousStatus,
            order.Status,
            order.UpdatedAt.Value
        ));
    }
}
