using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Orders.ApproveTransferOrder;

public sealed record ApproveTransferCommand(Guid OrderId, bool IsApproved, string? RejectionReason = null);

public sealed record ApproveTransferResponse(Guid OrderId, OrderStatus NewStatus, string Message);

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

public sealed class ApproveTransferOrderHandler
{
    private readonly AppDbContext _context;

    public ApproveTransferOrderHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ApproveTransferResponse>> Handle(ApproveTransferCommand command, CancellationToken cancellationToken = default)
    {
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

            return Result.Success(new ApproveTransferResponse(
                order.Id,
                order.Status,
                $"Comprobante rechazado: {command.RejectionReason ?? "Fondos no acreditados."}"
            ));
        }
    }
}
