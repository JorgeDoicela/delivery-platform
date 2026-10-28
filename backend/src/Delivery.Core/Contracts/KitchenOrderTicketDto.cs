using Delivery.Core.Domain.Enums;

namespace Delivery.Core.Contracts;

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

