using Delivery.Core.Common;
using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Catalog.ToggleProductStatus;

public sealed record ToggleProductStatusCommand(int ProductId, bool IsActive);

public sealed record ToggleProductStatusResponse(int ProductId, bool IsActive, string ProductName);

public sealed class ToggleProductStatusValidator : AbstractValidator<ToggleProductStatusCommand>
{
    public ToggleProductStatusValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0)
            .WithMessage("El identificador del producto debe ser mayor a 0.");
    }
}

public static class ToggleProductStatusErrors
{
    public static readonly Error ProductNotFound = new(
        "Catalog.ProductNotFound",
        "El producto solicitado no fue encontrado en el catálogo."
    );
}

public sealed class ToggleProductStatusHandler : IHandler<ToggleProductStatusCommand, Result<ToggleProductStatusResponse>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<ToggleProductStatusCommand> _validator;
    private readonly IKitchenNotifier _kitchenNotifier;

    public ToggleProductStatusHandler(
        AppDbContext context,
        IValidator<ToggleProductStatusCommand> validator,
        IKitchenNotifier kitchenNotifier)
    {
        _context = context;
        _validator = validator;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<Result<ToggleProductStatusResponse>> Handle(ToggleProductStatusCommand command, CancellationToken cancellationToken = default)
    {
        var validationResult = await _validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            var firstError = validationResult.Errors[0];
            return Result.Failure<ToggleProductStatusResponse>(new Error(firstError.ErrorCode, firstError.ErrorMessage));
        }

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == command.ProductId, cancellationToken);
        if (product is null)
        {
            return Result.Failure<ToggleProductStatusResponse>(ToggleProductStatusErrors.ProductNotFound);
        }

        product.IsActive = command.IsActive;
        await _context.SaveChangesAsync(cancellationToken);

        // Notificación en tiempo real al ecosistema operativo
        await _kitchenNotifier.NotifyStockUpdatedAsync(product.Id, product.IsActive, cancellationToken);

        return Result.Success(new ToggleProductStatusResponse(product.Id, product.IsActive, product.Name));
    }
}
