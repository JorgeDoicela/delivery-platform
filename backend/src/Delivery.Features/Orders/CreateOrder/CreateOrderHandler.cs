using Delivery.Core.Common;
using Delivery.Core.Contracts;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using StackExchange.Redis;
using Order = Delivery.Core.Domain.Entities.Order;

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
    List<CreateOrderItemRequest> Items
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

public sealed class CreateOrderHandler : IHandler<CreateOrderCommand, Result<CreateOrderResponse>>
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private readonly AppDbContext _context;
    private readonly IValidator<CreateOrderCommand> _validator;
    private readonly IConnectionMultiplexer _redis;
    private readonly IKitchenNotifier _kitchenNotifier;

    public CreateOrderHandler(
        AppDbContext context,
        IValidator<CreateOrderCommand> validator,
        IConnectionMultiplexer redis,
        IKitchenNotifier kitchenNotifier)
    {
        _context = context;
        _validator = validator;
        _redis = redis;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<Result<CreateOrderResponse>> Handle(CreateOrderCommand request, CancellationToken cancellationToken = default)
    {
        var command = request;
        var validation = await _validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<CreateOrderResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var branch = await _context.Branches
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == command.BranchId && b.IsActive, cancellationToken);

        if (branch is null)
        {
            return Result.Failure<CreateOrderResponse>(CreateOrderErrors.BranchNotFound);
        }

        // Consultar productos solicitados desde la base de datos (seguridad: blindaje del subtotal)
        var productIds = command.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id) && p.IsActive)
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
        {
            return Result.Failure<CreateOrderResponse>(CreateOrderErrors.ProductUnavailable);
        }

        // Consultar opciones de modificadores seleccionadas
        var allModifierOptionIds = command.Items
            .Where(i => i.SelectedModifierOptionIds is not null)
            .SelectMany(i => i.SelectedModifierOptionIds!)
            .Distinct()
            .ToList();

        var modifierOptions = new Dictionary<int, ModifierOption>();
        if (allModifierOptionIds.Count > 0)
        {
            modifierOptions = await _context.ModifierOptions
                .AsNoTracking()
                .Where(mo => allModifierOptionIds.Contains(mo.Id) && mo.IsAvailable)
                .ToDictionaryAsync(mo => mo.Id, cancellationToken);
        }

        // Obtener tarifa base de envío configurada para el tenant de la sucursal
        var tenantSettings = await _context.TenantSettings
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(ts => ts.TenantId == branch.TenantId, cancellationToken);

        decimal configuredDeliveryFee = tenantSettings?.BaseDeliveryFee ?? 1.50m;

        // Construir la orden y liquidar totales contables
        var order = new Order
        {
            TenantId = branch.TenantId,
            BranchId = branch.Id,
            CustomerName = command.CustomerName.Trim(),
            CustomerPhone = command.CustomerPhone.Trim(),
            CustomerEmail = command.CustomerEmail?.Trim(),
            IdentificationType = command.IdentificationType.Trim(),
            IdentificationNumber = command.IdentificationNumber.Trim(),
            AddressStreet = command.AddressStreet.Trim(),
            AddressReference = command.AddressReference?.Trim() ?? string.Empty,
            PaymentMethod = command.PaymentMethod,
            DeliveryType = command.DeliveryType,
            TransferReceiptUrl = command.TransferReceiptUrl,
            DeliveryFee = command.DeliveryType == DeliveryType.Delivery ? configuredDeliveryFee : 0.00m,
            CreatedAt = DateTime.UtcNow
        };

        if (command.DeliveryLatitude.HasValue && command.DeliveryLongitude.HasValue)
        {
            order.DeliveryLocation = GeometryFactory.CreatePoint(
                new Coordinate(command.DeliveryLongitude.Value, command.DeliveryLatitude.Value)
            );
        }

        decimal subtotal = 0m;

        foreach (var itemReq in command.Items)
        {
            var product = products[itemReq.ProductId];
            var orderItem = new OrderItem
            {
                OrderId = order.Id,
                ProductId = product.Id,
                ProductNameSnapshot = product.Name,
                UnitPriceSnapshot = product.BasePrice,
                Quantity = itemReq.Quantity
            };

            decimal itemModifiersTotal = 0m;
            if (itemReq.SelectedModifierOptionIds is not null)
            {
                foreach (var modOptionId in itemReq.SelectedModifierOptionIds)
                {
                    if (modifierOptions.TryGetValue(modOptionId, out var modOption))
                    {
                        var orderItemMod = new OrderItemModifier
                        {
                            OrderItemId = orderItem.Id,
                            ModifierOptionId = modOption.Id,
                            ModifierNameSnapshot = modOption.Name,
                            PriceSnapshot = modOption.AdditionalPrice
                        };
                        orderItem.Modifiers.Add(orderItemMod);
                        itemModifiersTotal += modOption.AdditionalPrice;
                    }
                }
            }

            subtotal += (product.BasePrice + itemModifiersTotal) * itemReq.Quantity;
            order.Items.Add(orderItem);
        }

        order.Subtotal = subtotal;
        order.Total = order.Subtotal + order.DeliveryFee;

        // Validar pagos en efectivo y cálculo de vuelto
        if (command.PaymentMethod == PaymentMethod.CashOnDelivery)
        {
            if (command.CashAmountPaid.HasValue)
            {
                if (command.CashAmountPaid.Value < order.Total)
                {
                    return Result.Failure<CreateOrderResponse>(CreateOrderErrors.InsufficientCashPayment);
                }

                order.CashAmountPaid = command.CashAmountPaid.Value;
                order.ChangeDue = order.CashAmountPaid.Value - order.Total;
            }
            order.Status = OrderStatus.Confirmed;
        }
        else if (command.PaymentMethod == PaymentMethod.BankTransfer)
        {
            order.Status = OrderStatus.PendingValidation;
        }
        else
        {
            order.Status = OrderStatus.Confirmed;
        }

        // Control de Capacidad Operativa y Throttling en Redis por franjas de 20 minutos (Sección 9.4)
        var db = _redis.GetDatabase();
        long currentSlot = (DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 1200) * 1200;
        string slotKey = $"branch:{branch.Id}:slot:{currentSlot}";

        long currentSlotOrders = await db.StringIncrementAsync(slotKey);
        if (currentSlotOrders == 1)
        {
            await db.KeyExpireAsync(slotKey, TimeSpan.FromHours(2), ExpireWhen.HasNoExpiry);
        }

        int maxOrders = branch.MaxOrdersPerSlot > 0 ? branch.MaxOrdersPerSlot : 15;
        int hardCap = (int)(maxOrders * 1.5);

        if (currentSlotOrders > hardCap)
        {
            await db.StringDecrementAsync(slotKey);
            return Result.Failure<CreateOrderResponse>(CreateOrderErrors.SlotCapacityExceeded);
        }

        string estimatedTime = "35-45 min";
        string? demandNotice = null;

        if (currentSlotOrders > maxOrders)
        {
            estimatedTime = "60-75 min";
            demandNotice = "Tiempo estimado de entrega extendido a 60-75 min por alta demanda en cocina.";
        }

        try
        {
            await _context.Orders.AddAsync(order, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await db.StringDecrementAsync(slotKey);
            throw;
        }

        var ticket = new KitchenOrderTicketDto(
            order.Id,
            order.CustomerName,
            order.DeliveryType,
            order.Status,
            order.AddressStreet,
            order.AddressReference,
            order.CreatedAt,
            order.Items.Select(i => new KitchenTicketItemDto(
                i.ProductNameSnapshot,
                i.Quantity,
                i.Modifiers.Select(m => new KitchenTicketModifierDto(m.ModifierNameSnapshot)).ToList()
            )).ToList()
        );

        // Notificación en tiempo real al Kitchen Display System (KDS) de la sucursal
        await _kitchenNotifier.NotifyNewOrderAsync(branch.Id, ticket, cancellationToken);

        return Result.Success(new CreateOrderResponse(
            order.Id,
            order.Status,
            order.Total,
            order.ChangeDue,
            branch.Name,
            order.CreatedAt,
            ticket,
            estimatedTime,
            demandNotice
        ));
    }
}
