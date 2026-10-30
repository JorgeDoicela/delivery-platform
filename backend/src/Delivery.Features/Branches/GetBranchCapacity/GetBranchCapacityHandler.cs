using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

namespace Delivery.Features.Branches.GetBranchCapacity;

public sealed record GetBranchCapacityQuery(int BranchId);

public sealed class GetBranchCapacityValidator : AbstractValidator<GetBranchCapacityQuery>
{
    public GetBranchCapacityValidator()
    {
        RuleFor(x => x.BranchId)
            .GreaterThan(0)
            .WithMessage("El identificador de la sucursal debe ser mayor a 0.");
    }
}

public sealed record BranchCapacityResponse(
    int BranchId,
    int CurrentSlotOrders,
    int MaxOrdersPerSlot,
    bool IsHighDemand,
    bool IsSaturated,
    string EstimatedDeliveryTime,
    string? DemandNotice
);

public sealed class GetBranchCapacityHandler : IHandler<GetBranchCapacityQuery, Result<BranchCapacityResponse>>
{
    private readonly AppDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly IValidator<GetBranchCapacityQuery> _validator;

    public GetBranchCapacityHandler(
        AppDbContext context,
        IConnectionMultiplexer redis,
        IValidator<GetBranchCapacityQuery> validator)
    {
        _context = context;
        _redis = redis;
        _validator = validator;
    }

    public async Task<Result<BranchCapacityResponse>> Handle(GetBranchCapacityQuery query, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<BranchCapacityResponse>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var branch = await _context.Branches
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == query.BranchId && b.IsActive, cancellationToken);

        if (branch is null)
        {
            return Result.Failure<BranchCapacityResponse>(new Error("Branch.NotFound", "Sucursal no encontrada o inactiva."));
        }

        var db = _redis.GetDatabase();
        long currentSlot = (DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 1200) * 1200;
        string slotKey = $"branch:{branch.Id}:slot:{currentSlot}";

        var countVal = await db.StringGetAsync(slotKey);
        int currentCount = countVal.IsNullOrEmpty ? 0 : (int)countVal;

        int maxOrders = branch.MaxOrdersPerSlot > 0 ? branch.MaxOrdersPerSlot : 15;
        int hardCap = (int)(maxOrders * 1.5);

        bool isHighDemand = currentCount > maxOrders && currentCount <= hardCap;
        bool isSaturated = currentCount > hardCap;
        string estimatedTime = isHighDemand ? "60-75 min" : (isSaturated ? "Pausado (Saturación)" : "35-45 min");
        string? notice = isHighDemand
            ? "Tiempo estimado de entrega extendido a 60-75 min por alta demanda en cocina."
            : (isSaturated ? "Cocina saturada temporalmente. Pedidos en pausa." : null);

        return Result.Success(new BranchCapacityResponse(
            branch.Id,
            currentCount,
            maxOrders,
            isHighDemand,
            isSaturated,
            estimatedTime,
            notice
        ));
    }
}

