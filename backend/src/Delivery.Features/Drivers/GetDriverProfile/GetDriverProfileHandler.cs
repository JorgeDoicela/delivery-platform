using System.Security.Claims;
using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Drivers.GetDriverProfile;

public sealed record GetDriverProfileQuery(Guid UserId);

public sealed record DriverProfileResponse(
    Guid DriverId,
    Guid UserId,
    string FullName,
    string Email,
    string Phone,
    string VehicleType,
    string? LicensePlate,
    bool IsAvailable,
    int? BranchId,
    string? BranchName,
    int TodayDeliveredCount,
    decimal TodayCashCollected
);

public static class GetDriverProfileErrors
{
    public static readonly Error DriverNotFound = new(
        "Drivers.NotFound",
        "No se encontró un perfil de repartidor activo para el usuario actual."
    );
}

public sealed class GetDriverProfileHandler : IHandler<GetDriverProfileQuery, Result<DriverProfileResponse>>
{
    private readonly AppDbContext _context;

    public GetDriverProfileHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DriverProfileResponse>> Handle(GetDriverProfileQuery query, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers
            .AsNoTracking()
            .Include(d => d.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Branch)
            .FirstOrDefaultAsync(d => d.UserId == query.UserId, cancellationToken);

        if (driver is null)
        {
            return Result.Failure<DriverProfileResponse>(GetDriverProfileErrors.DriverNotFound);
        }

        var driverRole = driver.User.UserRoles
            .FirstOrDefault(ur => ur.RoleId == Role.Driver && ur.BranchId.HasValue)
            ?? driver.User.UserRoles.FirstOrDefault(ur => ur.BranchId.HasValue);

        var branchId = driverRole?.BranchId;
        var branchName = driverRole?.Branch?.Name;

        // Calcular resumen del turno de hoy (UTC)
        var todayStartUtc = DateTime.UtcNow.Date;
        var deliveredTodayOrders = await _context.OrderDeliveries
            .AsNoTracking()
            .Where(od => od.DriverId == driver.Id
                         && od.Order.Status == OrderStatus.Delivered
                         && ((od.DeliveredAt.HasValue && od.DeliveredAt.Value >= todayStartUtc)
                             || (od.Order.UpdatedAt.HasValue && od.Order.UpdatedAt.Value >= todayStartUtc)))
            .Select(od => new
            {
                od.Order.Total,
                od.Order.PaymentMethod
            })
            .ToListAsync(cancellationToken);

        var todayCount = deliveredTodayOrders.Count;
        var cashCollected = deliveredTodayOrders
            .Where(o => o.PaymentMethod is PaymentMethod.CashOnDelivery)
            .Sum(o => o.Total);

        return Result.Success(new DriverProfileResponse(
            driver.Id,
            driver.UserId,
            driver.User.FullName,
            driver.User.Email,
            driver.User.Phone,
            driver.VehicleType,
            driver.LicensePlate,
            driver.IsAvailable,
            branchId,
            branchName,
            todayCount,
            cashCollected
        ));
    }
}
