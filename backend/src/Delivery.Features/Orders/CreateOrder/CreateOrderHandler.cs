using Delivery.Core.Common;
using Delivery.Core.Contracts;
using Delivery.Core.Contracts.Emails;
using Delivery.Core.Contracts.Emails.Models;
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

public sealed class CreateOrderHandler : IHandler<CreateOrderCommand, Result<CreateOrderResponse>>
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private readonly AppDbContext _context;
    private readonly IValidator<CreateOrderCommand> _validator;
    private readonly IConnectionMultiplexer _redis;
    private readonly IKitchenNotifier _kitchenNotifier;
    private readonly IBackgroundEmailQueue? _emailQueue;

    public CreateOrderHandler(
        AppDbContext context,
        IValidator<CreateOrderCommand> validator,
        IConnectionMultiplexer redis,
        IKitchenNotifier kitchenNotifier,
        IBackgroundEmailQueue? emailQueue = null)
    {
        _context = context;
        _validator = validator;
        _redis = redis;
        _kitchenNotifier = kitchenNotifier;
        _emailQueue = emailQueue;
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

        if (!command.UserId.HasValue || command.UserId.Value == Guid.Empty)
        {
            return Result.Failure<CreateOrderResponse>(CreateOrderErrors.AuthenticationRequired);
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == command.UserId.Value && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<CreateOrderResponse>(CreateOrderErrors.UserNotFound);
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

        // Directorio de Clientes SRI por Tenant para métricas de compras y autocompletado
        Customer? customer = null;
        var contactPhone = !string.IsNullOrWhiteSpace(command.CustomerPhone)
            ? command.CustomerPhone.Trim()
            : user.Phone;

        if (!string.IsNullOrWhiteSpace(contactPhone) || !string.IsNullOrWhiteSpace(user.Email))
        {
            customer = await _context.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == branch.TenantId && (c.Phone == contactPhone || c.Email == user.Email), cancellationToken);

            if (customer == null)
            {
                var idNum = !string.IsNullOrWhiteSpace(command.IdentificationNumber) && command.IdentificationNumber != "9999999999999"
                    ? command.IdentificationNumber.Trim()
                    : $"CF-{user.Id:N}"[..18];

                customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    TenantId = branch.TenantId,
                    FullName = !string.IsNullOrWhiteSpace(command.CustomerName) ? command.CustomerName.Trim() : user.FullName,
                    Phone = contactPhone,
                    Email = user.Email,
                    IdentificationType = !string.IsNullOrWhiteSpace(command.IdentificationType) ? command.IdentificationType.Trim() : "CONSUMIDOR_FINAL",
                    IdentificationNumber = idNum,
                    DefaultAddressStreet = command.AddressStreet.Trim(),
                    DefaultAddressReference = command.AddressReference?.Trim() ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    TotalOrdersCount = 1,
                    LastOrderAt = DateTime.UtcNow
                };
                await _context.Customers.AddAsync(customer, cancellationToken);
            }
            else
            {
                customer.TotalOrdersCount++;
                customer.LastOrderAt = DateTime.UtcNow;
            }
        }

        // Construir la orden y liquidar totales contables vinculada a la cuenta autenticada
        var order = new Order
        {
            TenantId = branch.TenantId,
            BranchId = branch.Id,
            CreatedByUserId = user.Id,
            CustomerId = customer?.Id,
            CustomerName = !string.IsNullOrWhiteSpace(command.CustomerName) ? command.CustomerName.Trim() : user.FullName,
            CustomerPhone = contactPhone,
            CustomerEmail = user.Email,
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

        // Despacho asíncrono y resiliente de correo de confirmación de pedido mediante Hangfire
        if (_emailQueue != null && !string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            var tenant = branch.TenantId != Guid.Empty
                ? await _context.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == branch.TenantId, cancellationToken)
                : null;

            var brand = tenant != null
                ? new BrandEmailContext
                {
                    BrandName = tenant.Name,
                    BrandTagline = tenant.Tagline,
                    PrimaryColor = tenant.BrandPrimaryColor ?? "#E4002B",
                    LogoUrl = tenant.LogoUrl,
                    SupportEmail = tenant.ContactEmail,
                    SupportPhone = tenant.ContactPhone
                }
                : BrandEmailContext.DefaultPlatform;

            var emailModel = new OrderConfirmationEmailModel
            {
                Brand = brand,
                OrderNumber = order.OrderNumber,
                OrderId = order.Id,
                CustomerName = order.CustomerName,
                CreatedAt = order.CreatedAt,
                BranchName = branch.Name,
                AddressStreet = order.AddressStreet,
                AddressReference = order.AddressReference,
                PaymentMethod = order.PaymentMethod.ToString(),
                EstimatedDeliveryTime = estimatedTime,
                TrackingUrl = $"https://mesafy.doicela.dev/{tenant?.Slug ?? "la-granjita"}/rastreo/{order.Id}",
                Items = order.Items.Select(i => new OrderItemEmailDto(
                    i.ProductNameSnapshot,
                    i.Quantity,
                    i.UnitPriceSnapshot,
                    (i.UnitPriceSnapshot + i.Modifiers.Sum(m => m.PriceSnapshot)) * i.Quantity,
                    string.Join(", ", i.Modifiers.Select(m => m.ModifierNameSnapshot))
                )).ToList(),
                Subtotal = order.Subtotal,
                DeliveryFee = order.DeliveryFee,
                DiscountAmount = order.DiscountAmount,
                Total = order.Total
            };

            _emailQueue.EnqueueTemplatedEmail(
                order.CustomerEmail,
                order.CustomerName,
                $"Confirmación de Pedido #{order.OrderNumber} - {brand.BrandName}",
                EmailTemplateType.OrderConfirmation,
                emailModel,
                order.TenantId
            );
        }

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
