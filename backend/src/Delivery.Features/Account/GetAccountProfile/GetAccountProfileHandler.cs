using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Privacy;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Account.GetAccountProfile;

public sealed record GetAccountProfileQuery(Guid UserId);

public sealed class GetAccountProfileHandler : IHandler<GetAccountProfileQuery, Result<AccountProfileDto>>
{
    private readonly AppDbContext _context;
    private readonly ICustomerConsentTracker _consentTracker;

    private static readonly OrderStatus[] ActiveOrderStatuses =
    [
        OrderStatus.Created,
        OrderStatus.PendingValidation,
        OrderStatus.Confirmed,
        OrderStatus.InKitchen,
        OrderStatus.ReadyForDelivery,
        OrderStatus.OnTheWay
    ];

    public GetAccountProfileHandler(AppDbContext context, ICustomerConsentTracker consentTracker)
    {
        _context = context;
        _consentTracker = consentTracker;
    }

    public async Task<Result<AccountProfileDto>> Handle(GetAccountProfileQuery request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<AccountProfileDto>(AccountErrors.UserNotFound);
        }

        var normalizedEmail = user.Email.Trim().ToLowerInvariant();

        // Contabilizar pedidos históricos y activos por email del usuario (ignorando filtros de tenant para estadísticas globales del cliente)
        var totalOrders = await _context.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .CountAsync(o => o.CustomerEmail != null && o.CustomerEmail.ToLower() == normalizedEmail, cancellationToken);

        var activeOrders = await _context.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .CountAsync(o => o.CustomerEmail != null && o.CustomerEmail.ToLower() == normalizedEmail && ActiveOrderStatuses.Contains(o.Status), cancellationToken);

        // Consultar estado de consentimiento WhatsApp LOPDP
        var consentActive = false;
        if (!string.IsNullOrWhiteSpace(user.Phone))
        {
            if (_context.CurrentTenantId.HasValue)
            {
                consentActive = await _consentTracker.HasConsentAsync(_context.CurrentTenantId.Value, user.Phone, cancellationToken);
            }
            else
            {
                consentActive = await _context.CustomerConsents
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .AnyAsync(cc => cc.PhoneNumber == user.Phone && !cc.IsRevoked, cancellationToken);
            }
        }

        var dto = new AccountProfileDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Phone ?? string.Empty,
            user.IdentificationType ?? "CONSUMIDOR_FINAL",
            user.IdentificationNumber ?? "9999999999999",
            user.IsEmailVerified,
            user.CreatedAt,
            totalOrders,
            activeOrders,
            consentActive
        );

        return Result.Success(dto);
    }
}
