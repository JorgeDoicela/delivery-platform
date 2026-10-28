using Delivery.Core.Common;
using Delivery.Core.Contracts;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Kitchen.GetActiveKitchenOrders;

public sealed record GetActiveKitchenOrdersQuery(int BranchId);

public sealed class GetActiveKitchenOrdersValidator : AbstractValidator<GetActiveKitchenOrdersQuery>
{
    public GetActiveKitchenOrdersValidator()
    {
        RuleFor(x => x.BranchId)
            .GreaterThan(0)
            .WithMessage("El identificador de sucursal debe ser mayor a 0.");
    }
}

public sealed class GetActiveKitchenOrdersHandler : IHandler<GetActiveKitchenOrdersQuery, Result<List<KitchenOrderTicketDto>>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<GetActiveKitchenOrdersQuery> _validator;

    public GetActiveKitchenOrdersHandler(AppDbContext context, IValidator<GetActiveKitchenOrdersQuery> validator)
    {
        _context = context;
        _validator = validator;
    }

    public async Task<Result<List<KitchenOrderTicketDto>>> Handle(GetActiveKitchenOrdersQuery query, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<List<KitchenOrderTicketDto>>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var activeStatuses = new[]
        {
            OrderStatus.Confirmed,
            OrderStatus.InKitchen,
            OrderStatus.ReadyForDelivery
        };

        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.BranchId == query.BranchId && activeStatuses.Contains(o.Status))
            .OrderBy(o => o.CreatedAt) // FIFO: Primero en entrar, primero en salir
            .Include(o => o.Items)
                .ThenInclude(i => i.Modifiers)
            .ToListAsync(cancellationToken);

        var tickets = orders.Select(o => new KitchenOrderTicketDto(
            o.Id,
            o.CustomerName,
            o.DeliveryType,
            o.Status,
            o.AddressStreet,
            o.AddressReference,
            o.CreatedAt,
            o.Items.Select(i => new KitchenTicketItemDto(
                i.ProductNameSnapshot,
                i.Quantity,
                i.Modifiers.Select(m => new KitchenTicketModifierDto(m.ModifierNameSnapshot)).ToList()
            )).ToList()
        )).ToList();

        return Result.Success(tickets);
    }
}
