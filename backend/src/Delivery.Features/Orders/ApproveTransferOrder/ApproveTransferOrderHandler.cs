using Delivery.Core.Common;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Orders.ApproveTransferOrder;

public sealed record ApproveTransferCommand(Guid OrderId, bool IsApproved, string? RejectionReason = null);

public sealed record ApproveTransferResponse(Guid OrderId, OrderStatus NewStatus, string Message);

public sealed class ApproveTransferValidator : AbstractValidator<ApproveTransferCommand>
{
    public ApproveTransferValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("El identificador de la orden no puede ser un GUID vacío.");

        When(x => !string.IsNullOrEmpty(x.RejectionReason), () =>
        {
            RuleFor(x => x.RejectionReason).MaximumLength(500);
        });
    }
}

public static class ApproveTransferErrors
{
    public static readonly Error OrderNotFound = new(
        "Orders.NotFound",
        "La orden especificada no fue encontrada."
    );

    public static readonly Error NotPendingValidation = new(
        "Orders.NotPendingValidation",
        "La orden no se encuentra en estado pendiente de validación de comprobante."
    );
}

public sealed class ApproveTransferOrderHandler : IHandler<ApproveTransferCommand, Result<ApproveTransferResponse>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<ApproveTransferCommand> _validator;
    private readonly IKitchenNotifier _kitchenNotifier;

    public ApproveTransferOrderHandler(
        AppDbContext context,
        IValidator<ApproveTransferCommand> validator,
        IKitchenNotifier kitchenNotifier)
    {
        _context = context;
        _validator = validator;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<Result<ApproveTransferResponse>> Handle(ApproveTransferCommand command, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<ApproveTransferResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == command.OrderId, cancellationToken);

        if (order is null)
        {
            return Result.Failure<ApproveTransferResponse>(ApproveTransferErrors.OrderNotFound);
        }

        if (order.Status != OrderStatus.PendingValidation)
        {
            return Result.Failure<ApproveTransferResponse>(ApproveTransferErrors.NotPendingValidation);
        }

        if (command.IsApproved)
        {
            order.Status = OrderStatus.Confirmed;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            // Notificar a las pantallas KDS de cocina que la orden fue confirmada
            await _kitchenNotifier.NotifyOrderStatusChangedAsync(order.Id, OrderStatus.Confirmed, cancellationToken);

            return Result.Success(new ApproveTransferResponse(
                order.Id,
                order.Status,
                "Comprobante de transferencia aprobado. Orden enviada a cocina."
            ));
        }
        else
        {
            order.Status = OrderStatus.Cancelled;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            // Notificar cancelación a cocina si aplica
            await _kitchenNotifier.NotifyOrderStatusChangedAsync(order.Id, OrderStatus.Cancelled, cancellationToken);

            return Result.Success(new ApproveTransferResponse(
                order.Id,
                order.Status,
                $"Comprobante rechazado: {command.RejectionReason ?? "Fondos no acreditados."}"
            ));
        }
    }
}
