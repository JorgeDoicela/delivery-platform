using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Orders.GetOrderById;

public sealed record GetOrderByIdQuery(
    Guid OrderId,
    Guid? RequesterUserId = null,
    IReadOnlyList<string>? RequesterRoles = null
);

public sealed class GetOrderByIdValidator : AbstractValidator<GetOrderByIdQuery>
{
    public GetOrderByIdValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("El identificador de la orden no puede ser un GUID vacío.");
    }
}

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
    int OrderNumber,
    int BranchId,
    string BranchName,
    string TenantSlug,
    string TenantName,
    double? BranchLatitude,
    double? BranchLongitude,
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
        "La orden solicitada no existe o no pertenece a este establecimiento."
    );

    public static readonly Error AuthenticationRequired = new(
        "Orders.AuthenticationRequired",
        "Se requiere iniciar sesión con la cuenta propietaria para consultar los detalles y rastreo del pedido."
    );

    public static readonly Error Forbidden = new(
        "Orders.Forbidden",
        "No tienes autorización para consultar los datos de este pedido."
    );
}

public sealed class GetOrderByIdHandler : IHandler<GetOrderByIdQuery, Result<OrderDetailResponse>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<GetOrderByIdQuery> _validator;

    public GetOrderByIdHandler(AppDbContext context, IValidator<GetOrderByIdQuery> validator)
    {
        _context = context;
        _validator = validator;
    }

    public async Task<Result<OrderDetailResponse>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<OrderDetailResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var order = await _context.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(o => o.Tenant)
            .Include(o => o.Branch)
            .Include(o => o.Items)
                .ThenInclude(i => i.Modifiers)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
        {
            return Result.Failure<OrderDetailResponse>(GetOrderByIdErrors.OrderNotFound);
        }

        // 1. Verificación de Aislamiento Multi-Tenant:
        // Si la petición viene bajo el ámbito de un Tenant específico, la orden debe pertenecer a dicho Tenant.
        if (_context.CurrentTenantId.HasValue && order.TenantId != _context.CurrentTenantId.Value)
        {
            return Result.Failure<OrderDetailResponse>(GetOrderByIdErrors.OrderNotFound);
        }

        // 2. Verificación de Regla de Negocio de Autorización:
        // El personal operativo (Admin, BranchAdmin, Kitchen, Driver, Cashier, SuperAdmin) puede consultar órdenes del tenant.
        // Los clientes solo pueden consultar órdenes que pertenezcan a su propia cuenta autenticada.
        var roles = request.RequesterRoles ?? Array.Empty<string>();
        bool isStaffOrAdmin = roles.Any(r => r is "SuperAdmin" or "Admin" or "TenantAdmin" or "BranchAdmin" or "Kitchen" or "Driver" or "Cashier");

        if (!isStaffOrAdmin)
        {
            if (!request.RequesterUserId.HasValue)
            {
                return Result.Failure<OrderDetailResponse>(GetOrderByIdErrors.AuthenticationRequired);
            }

            var requesterUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == request.RequesterUserId.Value && u.IsActive, cancellationToken);

            if (requesterUser is null)
            {
                return Result.Failure<OrderDetailResponse>(GetOrderByIdErrors.AuthenticationRequired);
            }

            bool isEmailMatch = !string.IsNullOrWhiteSpace(order.CustomerEmail)
                && string.Equals(order.CustomerEmail, requesterUser.Email, StringComparison.OrdinalIgnoreCase);

            bool isPhoneMatch = false;
            if (!string.IsNullOrWhiteSpace(requesterUser.Phone) && !string.IsNullOrWhiteSpace(order.CustomerPhone))
            {
                var reqDigits = new string(requesterUser.Phone.Where(char.IsDigit).ToArray());
                var orderDigits = new string(order.CustomerPhone.Where(char.IsDigit).ToArray());
                if (reqDigits == orderDigits)
                {
                    isPhoneMatch = true;
                }
                else if (reqDigits.Length >= 8 && orderDigits.Length >= 8)
                {
                    isPhoneMatch = reqDigits[^8..] == orderDigits[^8..];
                }
            }

            bool isOwner = (order.CreatedByUserId.HasValue && order.CreatedByUserId.Value == requesterUser.Id)
                || isEmailMatch
                || isPhoneMatch;

            if (!isOwner)
            {
                return Result.Failure<OrderDetailResponse>(GetOrderByIdErrors.Forbidden);
            }
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
            order.OrderNumber,
            order.BranchId,
            order.Branch?.Name ?? string.Empty,
            order.Tenant?.Slug ?? string.Empty,
            order.Tenant?.Name ?? string.Empty,
            order.Branch?.LocationPoint?.Y, // Latitud de la sucursal
            order.Branch?.LocationPoint?.X, // Longitud de la sucursal
            order.CustomerName,
            order.CustomerPhone,
            order.CustomerEmail,
            order.IdentificationType,
            order.IdentificationNumber,
            order.AddressStreet,
            order.AddressReference,
            order.DeliveryLocation?.Y, // Latitud de entrega
            order.DeliveryLocation?.X, // Longitud de entrega
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
