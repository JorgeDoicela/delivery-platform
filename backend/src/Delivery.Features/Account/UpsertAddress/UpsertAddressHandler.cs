using Delivery.Core.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Http;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Delivery.Features.Account.UpsertAddress;

public sealed record UpsertAddressRequest(
    Guid? Id,
    string Title,
    string Street,
    string? Reference,
    string? City,
    double? Latitude,
    double? Longitude,
    bool IsDefault
);

public sealed record UpsertAddressCommand(
    Guid UserId,
    Guid? Id,
    string Title,
    string Street,
    string? Reference,
    string? City,
    double? Latitude,
    double? Longitude,
    bool IsDefault
);

public sealed class UpsertAddressValidator : AbstractValidator<UpsertAddressCommand>
{
    public UpsertAddressValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("El título de la dirección es requerido (ej. Casa, Trabajo).")
            .MaximumLength(60).WithMessage("El título no puede exceder 60 caracteres.");

        RuleFor(x => x.Street)
            .NotEmpty().WithMessage("La calle y número de casa/departamento es requerida.")
            .MaximumLength(250).WithMessage("La calle no puede exceder 250 caracteres.");

        RuleFor(x => x.Reference)
            .MaximumLength(250).WithMessage("La referencia no puede exceder 250 caracteres.");

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("La ciudad no puede exceder 100 caracteres.");
    }
}

public sealed class UpsertAddressHandler : IHandler<UpsertAddressCommand, Result<AccountAddressDto>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<UpsertAddressCommand> _validator;

    public UpsertAddressHandler(AppDbContext context, IValidator<UpsertAddressCommand> validator)
    {
        _context = context;
        _validator = validator;
    }

    public async Task<Result<AccountAddressDto>> Handle(UpsertAddressCommand request, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<AccountAddressDto>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<AccountAddressDto>(AccountErrors.UserNotFound);
        }

        CustomerAddress address;

        if (request.Id.HasValue && request.Id.Value != Guid.Empty)
        {
            var existing = await _context.CustomerAddresses
                .FirstOrDefaultAsync(a => a.Id == request.Id.Value && a.UserId == request.UserId, cancellationToken);

            if (existing is null)
            {
                return Result.Failure<AccountAddressDto>(AccountErrors.AddressNotFound);
            }

            existing.Title = request.Title.Trim();
            existing.Street = request.Street.Trim();
            existing.Reference = request.Reference?.Trim() ?? string.Empty;
            existing.City = string.IsNullOrWhiteSpace(request.City) ? "Quito" : request.City.Trim();
            existing.Latitude = request.Latitude;
            existing.Longitude = request.Longitude;
            existing.IsDefault = request.IsDefault;

            address = existing;
        }
        else
        {
            var count = await _context.CustomerAddresses
                .CountAsync(a => a.UserId == request.UserId, cancellationToken);

            if (count >= 10)
            {
                return Result.Failure<AccountAddressDto>(AccountErrors.AddressLimitExceeded);
            }

            address = new CustomerAddress
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Title = request.Title.Trim(),
                Street = request.Street.Trim(),
                Reference = request.Reference?.Trim() ?? string.Empty,
                City = string.IsNullOrWhiteSpace(request.City) ? "Quito" : request.City.Trim(),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                IsDefault = count == 0 || request.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            await _context.CustomerAddresses.AddAsync(address, cancellationToken);
        }

        // Si se marca como predeterminada, desmarcar en las demás
        if (address.IsDefault)
        {
            var otherAddresses = await _context.CustomerAddresses
                .Where(a => a.UserId == request.UserId && a.Id != address.Id && a.IsDefault)
                .ToListAsync(cancellationToken);

            foreach (var other in otherAddresses)
            {
                other.IsDefault = false;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new AccountAddressDto(
            address.Id,
            address.Title,
            address.Street,
            address.Reference,
            address.City,
            address.Latitude,
            address.Longitude,
            address.IsDefault,
            address.CreatedAt
        );

        return Result.Success(dto);
    }
}

public sealed class UpsertAddressEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/account/addresses", async (
            UpsertAddressRequest body,
            UpsertAddressHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? httpContext.User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Identificador de usuario no válido en el token.");
            }

            var command = new UpsertAddressCommand(
                userId,
                body.Id,
                body.Title,
                body.Street,
                body.Reference,
                body.City,
                body.Latitude,
                body.Longitude,
                body.IsDefault
            );

            var result = await handler.Handle(command, cancellationToken);

            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("UpsertAddress")
        .WithTags("Account")
        .Produces<AccountAddressDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
