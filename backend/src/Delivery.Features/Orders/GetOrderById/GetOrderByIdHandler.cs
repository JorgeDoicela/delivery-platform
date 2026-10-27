using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Orders.GetOrderById;

public sealed record GetOrderByIdQuery(Guid OrderId);

public sealed record OrderDetailModifierDto(
    Guid Id,
    string ModifierName,
    decimal Price
);

public sealed record OrderDetailItemDto(
    Guid Id,
    int ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal,
    List<OrderDetailModifierDto> Modifiers
);

public sealed record OrderDetailResponse(
    Guid OrderId,
    int BranchId,
    string BranchName,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string IdentificationType,
    string IdentificationNumber,
    string AddressStreet,
    string AddressReference,
    double? DeliveryLatitude,
    double? DeliveryLongitude,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    OrderStatus Status,
    PaymentMethod PaymentMethod,
    DeliveryType DeliveryType,
    decimal? CashAmountPaid,
    decimal? ChangeDue,
    string? TransferReceiptUrl,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<OrderDetailItemDto> Items
);

public static class GetOrderByIdErrors
{
    public static readonly Error OrderNotFound = new(
        "Orders.NotFound",
        "La orden solicitada no existe."
    );
}

public sealed class GetOrderByIdHandler
{
    private readonly AppDbContext _context;

    public GetOrderByIdHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDetailResponse>> Handle(GetOrderByIdQuery query, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Branch)
            .Include(o => o.Items)
                .ThenInclude(i => i.Modifiers)
            .FirstOrDefaultAsync(o => o.Id == query.OrderId, cancellationToken);

        if (order is null)
        {
            return Result.Failure<OrderDetailResponse>(GetOrderByIdErrors.OrderNotFound);
        }

        var itemDtos = order.Items.Select(item =>
        {
            var modifiersTotal = item.Modifiers.Sum(m => m.PriceSnapshot);
            var lineTotal = (item.UnitPriceSnapshot + modifiersTotal) * item.Quantity;

            return new OrderDetailItemDto(
                item.Id,
                item.ProductId,
                item.ProductNameSnapshot,
                item.UnitPriceSnapshot,
                item.Quantity,
                lineTotal,
                item.Modifiers.Select(m => new OrderDetailModifierDto(
                    m.Id,
                    m.ModifierNameSnapshot,
                    m.PriceSnapshot
                )).ToList()
            );
        }).ToList();

        var response = new OrderDetailResponse(
            order.Id,
            order.BranchId,
            order.Branch.Name,
            order.CustomerName,
            order.CustomerPhone,
            order.CustomerEmail,
            order.IdentificationType,
            order.IdentificationNumber,
            order.AddressStreet,
            order.AddressReference,
            order.DeliveryLocation?.Y, // Latitud
            order.DeliveryLocation?.X, // Longitud
            order.Subtotal,
            order.DeliveryFee,
            order.Total,
            order.Status,
            order.PaymentMethod,
            order.DeliveryType,
            order.CashAmountPaid,
            order.ChangeDue,
            order.TransferReceiptUrl,
            order.CreatedAt,
            order.UpdatedAt,
            itemDtos
        );

        return Result.Success(response);
    }
}
