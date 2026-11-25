using Delivery.Core.Common;
using Delivery.Core.Contracts;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Enums;
using FluentValidation;

namespace Delivery.Features.Orders.CreateOrder;

public sealed record CreateOrderItemRequest(
    int ProductId,
    int Quantity,
    List<int>? SelectedModifierOptionIds
);

public sealed record CreateOrderCommand(
    int BranchId,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string IdentificationType,
    string IdentificationNumber,
    string AddressStreet,
    string AddressReference,
    double? DeliveryLatitude,
    double? DeliveryLongitude,
    PaymentMethod PaymentMethod,
    DeliveryType DeliveryType,
    decimal? CashAmountPaid,
    string? TransferReceiptUrl,
    List<CreateOrderItemRequest> Items,
    Guid? UserId = null
);

public sealed record CreateOrderResponse(
    Guid OrderId,
    OrderStatus Status,
    decimal Total,
    decimal? ChangeDue,
    string BranchName,
    DateTime CreatedAt,
    KitchenOrderTicketDto? Ticket = null,
    string? EstimatedDeliveryTime = null,
    string? DemandNotice = null
);

public static class CreateOrderErrors
{
    public static readonly Error AuthenticationRequired = new(
        "Orders.AuthenticationRequired",
        "Se requiere una cuenta autenticada para confirmar y realizar el pedido."
    );

    public static readonly Error UserNotFound = new(
        "Orders.UserNotFound",
        "El usuario autenticado no existe o se encuentra inactivo."
    );

    public static readonly Error SlotCapacityExceeded = new(
        "Orders.SlotCapacityExceeded",
        "La cocina se encuentra temporalmente al 150% de su capacidad física de producción. Admisión pausada para proteger la calidad. Intenta en unos minutos."
    );

    public static readonly Error BranchNotFound = new(
        "Orders.BranchNotFound",
        "La sucursal seleccionada no existe o se encuentra inactiva."
    );

    public static readonly Error EmptyOrder = new(
        "Orders.EmptyOrder",
        "El pedido debe contener al menos un producto."
    );

    public static readonly Error ProductUnavailable = new(
        "Orders.ProductUnavailable",
        "Uno o más productos seleccionados no existen o están agotados."
    );

    public static readonly Error InsufficientCashPayment = new(
        "Orders.InsufficientCashPayment",
        "El monto en efectivo indicado es inferior al total a pagar."
    );
}

public sealed class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.UserId)
            .NotNull()
            .NotEmpty()
            .NotEqual(Guid.Empty)
            .WithMessage("Se requiere una cuenta autenticada para realizar el pedido.");

        RuleFor(x => x.BranchId).GreaterThan(0);
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.CustomerPhone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.IdentificationType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.IdentificationNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AddressStreet).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Items).NotEmpty().WithMessage("Debe incluir al menos un producto.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).GreaterThan(0);
            item.RuleFor(i => i.Quantity).GreaterThan(0).LessThanOrEqualTo(50);
        });

        When(x => x.PaymentMethod == PaymentMethod.CashOnDelivery && x.CashAmountPaid.HasValue, () =>
        {
            RuleFor(x => x.CashAmountPaid!.Value).GreaterThan(0);
        });
    }
}
