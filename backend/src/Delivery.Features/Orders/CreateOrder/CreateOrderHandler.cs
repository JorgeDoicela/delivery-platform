using Delivery.Core.Common;
using Delivery.Core.Common.Spatial;
using Delivery.Core.Contracts;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Domain.Policies;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using StackExchange.Redis;
using Order = Delivery.Core.Domain.Entities.Order;

namespace Delivery.Features.Orders.CreateOrder;

public sealed class CreateOrderHandler : IHandler<CreateOrderCommand, Result<CreateOrderResponse>>
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);
    private readonly AppDbContext _context;
    private readonly IValidator<CreateOrderCommand> _validator;
    private readonly IConnectionMultiplexer _redis;
    private readonly IKitchenNotifier _kitchenNotifier;
    private readonly ITrackingNotifier? _trackingNotifier;

    public CreateOrderHandler(
        AppDbContext context,
        IValidator<CreateOrderCommand> validator,
        IConnectionMultiplexer redis,
        IKitchenNotifier kitchenNotifier,
        ITrackingNotifier? trackingNotifier = null)
    {
        _context = context;
        _validator = validator;
        _redis = redis;
        _kitchenNotifier = kitchenNotifier;
        _trackingNotifier = trackingNotifier;
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

        // Consultar productos solicitados desde la base de datos estrictamente aislados al Tenant de la sucursal
        var productIds = command.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.ProductModifierGroups)
            .Where(p => productIds.Contains(p.Id) && p.IsActive && p.TenantId == branch.TenantId)
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
        {
            return Result.Failure<CreateOrderResponse>(CreateOrderErrors.ProductUnavailable);
        }

        // Consultar overrides de disponibilidad y precio personalizado por sucursal (BranchProducts)
        var branchProducts = await _context.BranchProducts
            .AsNoTracking()
            .Where(bp => bp.BranchId == branch.Id && bp.TenantId == branch.TenantId && productIds.Contains(bp.ProductId))
            .ToDictionaryAsync(bp => bp.ProductId, cancellationToken);

        foreach (var productId in productIds)
        {
            if (branchProducts.TryGetValue(productId, out var bp) && !bp.IsAvailable)
            {
                return Result.Failure<CreateOrderResponse>(CreateOrderErrors.ProductUnavailable);
            }
        }

        // Consultar opciones de modificadores seleccionadas aisladas al Tenant de la sucursal
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
                .Include(mo => mo.ModifierGroup)
                .Where(mo => allModifierOptionIds.Contains(mo.Id) && mo.IsAvailable && mo.ModifierGroup.TenantId == branch.TenantId)
                .ToDictionaryAsync(mo => mo.Id, cancellationToken);
        }

        // Obtener tarifa base de envío: prioriza override de la sucursal, luego configuración de marca (TenantSetting)
        var tenantSettings = await _context.TenantSettings
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(ts => ts.TenantId == branch.TenantId, cancellationToken);

        // Validar modalidad de entrega y método de pago habilitados por el comercio
        if (tenantSettings is not null)
        {
            var deliveryAllowed = command.DeliveryType switch
            {
                DeliveryType.Delivery => tenantSettings.EnableDelivery,
                DeliveryType.Takeout => tenantSettings.EnableTakeout,
                _ => true
            };

            if (!deliveryAllowed)
            {
                return Result.Failure<CreateOrderResponse>(CreateOrderErrors.DeliveryTypeNotAccepted);
            }

            var paymentAllowed = command.PaymentMethod switch
            {
                PaymentMethod.CashOnDelivery => tenantSettings.AcceptsCash,
                PaymentMethod.BankTransfer => tenantSettings.AcceptsBankTransfer,
                PaymentMethod.CreditDebitCard => tenantSettings.AcceptsCard,
                _ => true
            };

            if (!paymentAllowed)
            {
                return Result.Failure<CreateOrderResponse>(CreateOrderErrors.PaymentMethodNotAccepted);
            }
        }

        // Si el negocio opera solo con Consumidor Final, se normalizan los datos fiscales
        var allowCustomBilling = tenantSettings?.AllowCustomBilling ?? true;
        var effectiveIdentificationType = allowCustomBilling && !string.IsNullOrWhiteSpace(command.IdentificationType)
            ? command.IdentificationType.Trim()
            : "CONSUMIDOR_FINAL";
        var effectiveIdentificationNumber = allowCustomBilling && effectiveIdentificationType != "CONSUMIDOR_FINAL" && !string.IsNullOrWhiteSpace(command.IdentificationNumber)
            ? command.IdentificationNumber.Trim()
            : "9999999999999";

        decimal configuredDeliveryFee = branch.BaseDeliveryFeeOverride
            ?? tenantSettings?.BaseDeliveryFee
            ?? 1.50m;

        // Directorio de Clientes SRI por Tenant para métricas de compras y autocompletado
        Customer? customer = null;
        var contactPhone = !string.IsNullOrWhiteSpace(command.CustomerPhone)
            ? command.CustomerPhone.Trim()
            : user.Phone;

        // Progressive Profiling: si el usuario no tenía teléfono (ej: registro con Google OAuth), se persiste en su cuenta
        if (string.IsNullOrWhiteSpace(user.Phone) && !string.IsNullOrWhiteSpace(contactPhone))
        {
            user.Phone = contactPhone;
        }

        if (!string.IsNullOrWhiteSpace(contactPhone) || !string.IsNullOrWhiteSpace(user.Email))
        {
            customer = await _context.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == branch.TenantId && (c.Phone == contactPhone || c.Email == user.Email), cancellationToken);

            if (customer == null)
            {
                var idNum = effectiveIdentificationNumber != "9999999999999"
                    ? effectiveIdentificationNumber
                    : $"CF-{user.Id:N}"[..18];

                customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    TenantId = branch.TenantId,
                    FullName = !string.IsNullOrWhiteSpace(command.CustomerName) ? command.CustomerName.Trim() : user.FullName,
                    Phone = contactPhone,
                    Email = user.Email,
                    IdentificationType = effectiveIdentificationType,
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

        // Calcular secuencial de comanda aislado por Tenant (inicia en #1001)
        var lastOrderNumber = await _context.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(o => o.TenantId == branch.TenantId)
            .Select(o => (int?)o.OrderNumber)
            .MaxAsync(cancellationToken) ?? 1000;
        var nextOrderNumber = lastOrderNumber < 1000 ? 1001 : lastOrderNumber + 1;

        // Construir la orden y liquidar totales contables vinculada a la cuenta autenticada
        var order = new Order
        {
            TenantId = branch.TenantId,
            BranchId = branch.Id,
            OrderNumber = nextOrderNumber,
            CreatedByUserId = user.Id,
            CustomerId = customer?.Id,
            CustomerName = !string.IsNullOrWhiteSpace(command.CustomerName) ? command.CustomerName.Trim() : user.FullName,
            CustomerPhone = contactPhone,
            CustomerEmail = user.Email,
            IdentificationType = effectiveIdentificationType,
            IdentificationNumber = effectiveIdentificationNumber,
            AddressStreet = command.AddressStreet.Trim(),
            AddressReference = command.AddressReference?.Trim() ?? string.Empty,
            PaymentMethod = command.PaymentMethod,
            DeliveryType = command.DeliveryType,
            TransferReceiptUrl = command.TransferReceiptUrl,
            DeliveryFee = Math.Round(command.DeliveryType == DeliveryType.Delivery ? configuredDeliveryFee : 0.00m, 2, MidpointRounding.AwayFromZero),
            CreatedAt = DateTime.UtcNow
        };

        if (command.DeliveryLatitude.HasValue && command.DeliveryLongitude.HasValue && branch.LocationPoint is not null)
        {
            order.DeliveryLocation = GeometryFactory.CreatePoint(
                new Coordinate(command.DeliveryLongitude.Value, command.DeliveryLatitude.Value)
            );
        }

        decimal subtotal = 0m;
        decimal taxTotal = 0m;

        foreach (var itemReq in command.Items)
        {
            var product = products[itemReq.ProductId];

            // Precio efectivo por sucursal: prioriza BranchProduct.CustomPrice si existe, sino Product.BasePrice
            var effectiveUnitPrice = branchProducts.TryGetValue(product.Id, out var branchProduct) && branchProduct.CustomPrice.HasValue
                ? Math.Round(branchProduct.CustomPrice.Value, 2, MidpointRounding.AwayFromZero)
                : Math.Round(product.BasePrice, 2, MidpointRounding.AwayFromZero);

            var orderItem = new OrderItem
            {
                OrderId = order.Id,
                ProductId = product.Id,
                ProductNameSnapshot = product.Name,
                UnitPriceSnapshot = effectiveUnitPrice,
                TaxRateSnapshot = product.TaxRate,
                Quantity = itemReq.Quantity
            };

            var allowedModifierGroupIds = product.ProductModifierGroups
                .Select(pmg => pmg.ModifierGroupId)
                .ToHashSet();

            decimal itemModifiersTotal = 0m;
            if (itemReq.SelectedModifierOptionIds is not null)
            {
                foreach (var modOptionId in itemReq.SelectedModifierOptionIds.Distinct())
                {
                    if (modifierOptions.TryGetValue(modOptionId, out var modOption))
                    {
                        // Si el producto define grupos de modificadores, exigir que la opción pertenezca al producto
                        if (allowedModifierGroupIds.Count > 0 && !allowedModifierGroupIds.Contains(modOption.ModifierGroupId))
                        {
                            continue;
                        }

                        var modPrice = Math.Round(modOption.AdditionalPrice, 2, MidpointRounding.AwayFromZero);
                        var orderItemMod = new OrderItemModifier
                        {
                            OrderItemId = orderItem.Id,
                            ModifierOptionId = modOption.Id,
                            ModifierNameSnapshot = modOption.Name,
                            PriceSnapshot = modPrice
                        };
                        orderItem.Modifiers.Add(orderItemMod);
                        itemModifiersTotal += modPrice;
                    }
                }
            }

            var lineGrossTotal = Math.Round((effectiveUnitPrice + itemModifiersTotal) * itemReq.Quantity, 2, MidpointRounding.AwayFromZero);
            subtotal += lineGrossTotal;

            // Desglose contable de IVA sobre PVP (precios mostrados con impuestos incluidos conforme a normativa SRI B2C)
            if (product.TaxRate > 0m)
            {
                var lineTaxBase = Math.Round(lineGrossTotal / (1m + (product.TaxRate / 100m)), 2, MidpointRounding.AwayFromZero);
                taxTotal += lineGrossTotal - lineTaxBase;
            }

            order.Items.Add(orderItem);
        }

        order.Subtotal = Math.Round(subtotal, 2, MidpointRounding.AwayFromZero);
        order.TaxAmount = Math.Round(taxTotal, 2, MidpointRounding.AwayFromZero);
        order.DiscountAmount = Math.Round(order.DiscountAmount, 2, MidpointRounding.AwayFromZero);

        if (command.DeliveryType == DeliveryType.Delivery)
        {
            double? straightLineKm = command.DeliveryLatitude.HasValue
                && command.DeliveryLongitude.HasValue
                && branch.LocationPoint is not null
                    ? HaversineCalculator.CalculateDistanceKm(
                        branch.LocationPoint.Y,
                        branch.LocationPoint.X,
                        command.DeliveryLatitude.Value,
                        command.DeliveryLongitude.Value)
                    : null;

            var deliveryFeeCalc = DeliveryFeePolicy.Calculate(
                baseFee: configuredDeliveryFee,
                enableDynamicDistanceFee: tenantSettings?.EnableDynamicDistanceFee ?? false,
                baseDistanceKm: tenantSettings?.BaseDeliveryDistanceKm ?? 2.0,
                extraFeePerKm: tenantSettings?.ExtraDeliveryFeePerKm ?? 0.50m,
                maxDeliveryFee: tenantSettings?.MaxDeliveryFee,
                freeDeliveryMinOrderAmount: tenantSettings?.FreeDeliveryMinOrderAmount,
                straightLineDistanceKm: straightLineKm,
                orderSubtotal: order.Subtotal
            );
            order.DeliveryFee = deliveryFeeCalc.DeliveryFee;
        }
        else
        {
            order.DeliveryFee = 0.00m;
        }

        order.Total = Math.Round(Math.Max(0m, order.Subtotal - order.DiscountAmount + order.DeliveryFee), 2, MidpointRounding.AwayFromZero);

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

        double? orderDistanceKm = null;
        if (command.DeliveryLatitude.HasValue && command.DeliveryLongitude.HasValue && branch.LocationPoint is not null)
        {
            var branchLat = branch.LocationPoint.Y;
            var branchLon = branch.LocationPoint.X;
            orderDistanceKm = Math.Round(
                Delivery.Core.Common.Spatial.HaversineCalculator.CalculateDistanceKm(
                    branchLat,
                    branchLon,
                    command.DeliveryLatitude.Value,
                    command.DeliveryLongitude.Value
                ),
                2
            );
        }

        bool isTakeoutOrder = command.DeliveryType == DeliveryType.Takeout;
        bool isOrderHighDemand = currentSlotOrders > maxOrders;
        string estimatedTime = DeliveryTimeEstimator.Estimate(orderDistanceKm, isOrderHighDemand, false, isTakeoutOrder);
        string? demandNotice = isOrderHighDemand
            ? (isTakeoutOrder
                ? "Tiempo estimado de preparación extendido a 25-35 min por alta demanda en cocina."
                : $"Tiempo estimado de entrega extendido a {estimatedTime} por alta demanda en cocina.")
            : null;

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
            )).ToList(),
            order.PaymentMethod,
            order.TransferReceiptUrl,
            order.Total,
            order.ChangeDue
        );

        // Notificación en tiempo real al Kitchen Display System (KDS) de la sucursal
        await _kitchenNotifier.NotifyNewOrderAsync(branch.Id, ticket, cancellationToken);

        if (_trackingNotifier != null && order.CreatedByUserId.HasValue)
        {
            await _trackingNotifier.NotifyUserOrdersChangedAsync(order.CreatedByUserId.Value, order.Id, cancellationToken);
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
