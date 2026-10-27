namespace Delivery.Core.Domain.Enums;

public enum OrderStatus
{
    Created = 1,
    PendingValidation = 2,
    Confirmed = 3,
    InKitchen = 4,
    ReadyForDelivery = 5,
    OnTheWay = 6,
    Delivered = 7,
    Cancelled = 8
}
