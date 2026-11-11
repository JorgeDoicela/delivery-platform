using Delivery.Core.Common;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Privacy;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Account.UpdateAccountProfile;

public sealed record UpdateAccountProfileRequest(
    string FullName,
    string Phone,
    string? IdentificationType,
    string? IdentificationNumber
);

public sealed record UpdateAccountProfileCommand(
    Guid UserId,
    string FullName,
    string Phone,
    string? IdentificationType,
    string? IdentificationNumber
);

public sealed class UpdateAccountProfileValidator : AbstractValidator<UpdateAccountProfileCommand>
{
    private static readonly string[] AllowedIdTypes = ["CEDULA", "RUC", "PASAPORTE", "CONSUMIDOR_FINAL"];

    public UpdateAccountProfileValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("El nombre completo es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre no puede exceder 150 caracteres.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("El número de teléfono es obligatorio.")
            .MaximumLength(30).WithMessage("El teléfono no puede exceder 30 caracteres.");

        RuleFor(x => x.IdentificationType)
            .Must(type => string.IsNullOrWhiteSpace(type) || AllowedIdTypes.Contains(type.ToUpperInvariant()))
            .WithMessage("Tipo de identificación no válido (permitidos: CEDULA, RUC, PASAPORTE, CONSUMIDOR_FINAL).");

        RuleFor(x => x.IdentificationNumber)
            .MaximumLength(20).WithMessage("El documento de identidad no puede exceder 20 caracteres.");
    }
}

public sealed class UpdateAccountProfileHandler : IHandler<UpdateAccountProfileCommand, Result<AccountProfileDto>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<UpdateAccountProfileCommand> _validator;
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

    public UpdateAccountProfileHandler(
        AppDbContext context,
        IValidator<UpdateAccountProfileCommand> validator,
        ICustomerConsentTracker consentTracker)
    {
        _context = context;
        _validator = validator;
        _consentTracker = consentTracker;
    }

    public async Task<Result<AccountProfileDto>> Handle(UpdateAccountProfileCommand request, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<AccountProfileDto>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<AccountProfileDto>(AccountErrors.UserNotFound);
        }

        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone.Trim();
        user.IdentificationType = string.IsNullOrWhiteSpace(request.IdentificationType)
            ? "CONSUMIDOR_FINAL"
            : request.IdentificationType.Trim().ToUpperInvariant();
        user.IdentificationNumber = string.IsNullOrWhiteSpace(request.IdentificationNumber)
            ? "9999999999999"
            : request.IdentificationNumber.Trim();

        // Sincronizar directorio de clientes de caja si existe cliente con este email en el tenant activo
        var normalizedEmail = user.Email.Trim().ToLowerInvariant();
#pragma warning disable CA1862, CA1304, CA1311 // EF Core requiere ToLower() para traducir la comparación a SQL en el servidor
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == normalizedEmail, cancellationToken);

        if (existingCustomer != null)
        {
            existingCustomer.FullName = user.FullName;
            existingCustomer.Phone = user.Phone;
            existingCustomer.IdentificationType = user.IdentificationType;
            existingCustomer.IdentificationNumber = user.IdentificationNumber;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var totalOrders = await _context.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .CountAsync(o => o.CustomerEmail != null && o.CustomerEmail.ToLower() == normalizedEmail, cancellationToken);

        var activeOrders = await _context.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .CountAsync(o => o.CustomerEmail != null && o.CustomerEmail.ToLower() == normalizedEmail && ActiveOrderStatuses.Contains(o.Status), cancellationToken);
#pragma warning restore CA1862, CA1304, CA1311

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
            user.Phone,
            user.IdentificationType,
            user.IdentificationNumber,
            user.IsEmailVerified,
            user.CreatedAt,
            totalOrders,
            activeOrders,
            consentActive
        );

        return Result.Success(dto);
    }
}
