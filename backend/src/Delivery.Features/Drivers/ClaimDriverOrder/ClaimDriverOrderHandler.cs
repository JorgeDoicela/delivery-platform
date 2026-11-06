using Delivery.Core.Common;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Drivers.ClaimDriverOrder;

public sealed record ClaimDriverOrderCommand(Guid OrderId, Guid UserId);

public sealed record ClaimDriverOrderItemDto(
    string ProductName,
    int Quantity,
    List<string> Modifiers
);

public sealed record ClaimDriverOrderResponse(
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
    OrderStatus Status,
    DateTime AssignedAt,
    DateTime PickedUpAt,
    string? CustomerNotes,
    string BranchName,
    List<ClaimDriverOrderItemDto> Items
);

public sealed class ClaimDriverOrderValidator : AbstractValidator<ClaimDriverOrderCommand>
{
    public ClaimDriverOrderValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("El identificador de la orden no puede ser un GUID vacío.");

        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("El identificador de usuario es requerido.");
    }
}

public static class ClaimDriverOrderErrors
{
    public static readonly Error DriverNotFound = new(
        "Drivers.NotFound",
        "No se encontró un perfil de repartidor activo para el usuario actual."
    );

    public static readonly Error OrderNotFound = new(
        "Drivers.OrderNotFound",
        "La orden especificada no fue encontrada."
    );

    public static readonly Error NotADeliveryOrder = new(
        "Drivers.NotADeliveryOrder",
        "La orden especificada es para retiro en local o consumo en mesa, no para despacho a domicilio."
    );

    public static readonly Error InvalidStatus = new(
        "Drivers.InvalidStatusForClaim",
        "La comanda debe estar lista para despacho en cocina (ReadyForDelivery) para poder ser tomada."
    );

    public static readonly Error AlreadyClaimed = new(
        "Drivers.OrderAlreadyClaimed",
        "La orden ya ha sido asignada a otro motorizado en camino."
    );
}

public sealed class ClaimDriverOrderHandler : IHandler<ClaimDriverOrderCommand, Result<ClaimDriverOrderResponse>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<ClaimDriverOrderCommand> _validator;
    private readonly ITrackingNotifier _trackingNotifier;
    private readonly IKitchenNotifier _kitchenNotifier;

    public ClaimDriverOrderHandler(
        AppDbContext context,
        IValidator<ClaimDriverOrderCommand> validator,
        ITrackingNotifier trackingNotifier,
        IKitchenNotifier kitchenNotifier)
    {
        _context = context;
        _validator = validator;
        _trackingNotifier = trackingNotifier;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<Result<ClaimDriverOrderResponse>> Handle(ClaimDriverOrderCommand command, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<ClaimDriverOrderResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        // 1. Obtener entidad Driver
        var driver = await _context.Drivers
            .FirstOrDefaultAsync(d => d.UserId == command.UserId, cancellationToken);

        if (driver is null)
        {
            return Result.Failure<ClaimDriverOrderResponse>(ClaimDriverOrderErrors.DriverNotFound);
        }

        // 2. Obtener orden con sus relaciones
        var order = await _context.Orders
            .Include(o => o.Branch)
            .Include(o => o.Items)
                .ThenInclude(i => i.Modifiers)
            .FirstOrDefaultAsync(o => o.Id == command.OrderId, cancellationToken);

        if (order is null)
        {
            return Result.Failure<ClaimDriverOrderResponse>(ClaimDriverOrderErrors.OrderNotFound);
        }

        if (order.DeliveryType != DeliveryType.Delivery)
        {
            return Result.Failure<ClaimDriverOrderResponse>(ClaimDriverOrderErrors.NotADeliveryOrder);
        }

        // Validar que la orden esté lista para despacho o ya en cocina
        if (order.Status != OrderStatus.ReadyForDelivery && order.Status != OrderStatus.InKitchen)
        {
            return Result.Failure<ClaimDriverOrderResponse>(ClaimDriverOrderErrors.InvalidStatus);
        }

        // 3. Verificar o crear vinculación en OrderDelivery
        var existingDelivery = await _context.OrderDeliveries
            .FirstOrDefaultAsync(od => od.OrderId == order.Id, cancellationToken);

        var now = DateTime.UtcNow;

        if (existingDelivery is not null)
        {
            if (existingDelivery.DriverId != driver.Id && order.Status == OrderStatus.OnTheWay)
            {
                return Result.Failure<ClaimDriverOrderResponse>(ClaimDriverOrderErrors.AlreadyClaimed);
            }

            existingDelivery.DriverId = driver.Id;
            existingDelivery.PickedUpAt = now;
        }
        else
        {
            var newDelivery = new OrderDelivery
            {
                OrderId = order.Id,
                DriverId = driver.Id,
                AssignedAt = now,
                PickedUpAt = now
            };
            await _context.OrderDeliveries.AddAsync(newDelivery, cancellationToken);
        }

        // 4. Transición de estado de la orden a OnTheWay
        order.Status = OrderStatus.OnTheWay;
        order.UpdatedAt = now;

        await _context.SaveChangesAsync(cancellationToken);

        // 5. Notificar en tiempo real a clientes y pantallas de cocina
        await _trackingNotifier.NotifyOrderStatusChangedAsync(order.Id, order.Status, cancellationToken);
        await _kitchenNotifier.NotifyOrderStatusChangedAsync(order.Id, order.Status, cancellationToken);

        var response = new ClaimDriverOrderResponse(
            OrderId: order.Id,
            OrderNumber: order.OrderNumber,
            CustomerName: order.CustomerName,
            CustomerPhone: order.CustomerPhone,
            AddressStreet: order.AddressStreet,
            AddressReference: order.AddressReference,
            DeliveryLatitude: order.DeliveryLocation?.Y,
            DeliveryLongitude: order.DeliveryLocation?.X,
            Subtotal: order.Subtotal,
            DeliveryFee: order.DeliveryFee,
            Total: order.Total,
            PaymentMethod: order.PaymentMethod,
            Status: order.Status,
            AssignedAt: now,
            PickedUpAt: now,
            CustomerNotes: order.CustomerNotes,
            BranchName: order.Branch?.Name ?? "Sucursal Principal",
            Items: order.Items.Select(i => new ClaimDriverOrderItemDto(
                ProductName: i.ProductNameSnapshot,
                Quantity: i.Quantity,
                Modifiers: i.Modifiers.Select(m => m.ModifierNameSnapshot).ToList()
            )).ToList()
        );

        return Result.Success(response);
    }
}
