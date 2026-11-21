using Delivery.Core.Common;
using Delivery.Core.Domain.Policies;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Branches.UpdateBranchOperatingHours;

public static class UpdateBranchOperatingHoursErrors
{
    public static readonly Error BranchNotFound = new(
        "Branches.NotFound",
        "La sucursal especificada no existe o no pertenece al establecimiento activo."
    );
}

public sealed class UpdateBranchOperatingHoursHandler : IHandler<UpdateBranchOperatingHoursCommand, Result<UpdateBranchOperatingHoursResponse>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<UpdateBranchOperatingHoursCommand> _validator;

    public UpdateBranchOperatingHoursHandler(
        AppDbContext context,
        IValidator<UpdateBranchOperatingHoursCommand> validator)
    {
        _context = context;
        _validator = validator;
    }

    public async Task<Result<UpdateBranchOperatingHoursResponse>> Handle(
        UpdateBranchOperatingHoursCommand command,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            var firstError = validationResult.Errors[0];
            return Result.Failure<UpdateBranchOperatingHoursResponse>(new Error(
                firstError.ErrorCode ?? "Branches.ValidationFailed",
                firstError.ErrorMessage
            ));
        }

        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.Id == command.BranchId, cancellationToken);

        if (branch is null)
        {
            return Result.Failure<UpdateBranchOperatingHoursResponse>(UpdateBranchOperatingHoursErrors.BranchNotFound);
        }

        branch.OpeningTime = command.OpeningTime.Trim();
        branch.ClosingTime = command.ClosingTime.Trim();

        if (command.IsActive.HasValue)
        {
            branch.IsActive = command.IsActive.Value;
        }

        if (command.DeliveryRadiusKm.HasValue)
        {
            branch.DeliveryRadiusKm = command.DeliveryRadiusKm.Value > 0 ? command.DeliveryRadiusKm.Value : null;
        }

        if (command.IsCoverageStrict.HasValue)
        {
            branch.IsCoverageStrict = command.IsCoverageStrict.Value;
        }

        if (command.ApplyWorkflowOverrides)
        {
            branch.EnableKitchenWorkflowOverride = command.EnableKitchenWorkflowOverride;
            branch.AllowDirectCounterTakeoutDeliveryOverride = command.AllowDirectCounterTakeoutDeliveryOverride;
        }
        else
        {
            if (command.EnableKitchenWorkflowOverride.HasValue)
            {
                branch.EnableKitchenWorkflowOverride = command.EnableKitchenWorkflowOverride;
            }
            if (command.AllowDirectCounterTakeoutDeliveryOverride.HasValue)
            {
                branch.AllowDirectCounterTakeoutDeliveryOverride = command.AllowDirectCounterTakeoutDeliveryOverride;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var tenantWorkflow = branch.TenantId != Guid.Empty
            ? await _context.TenantSettings
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(ts => ts.TenantId == branch.TenantId)
                .Select(ts => new { ts.EnableKitchenWorkflow, ts.AllowDirectCounterTakeoutDelivery })
                .FirstOrDefaultAsync(cancellationToken)
            : null;

        var useKitchenWorkflow = KitchenWorkflowPolicy.ResolveKitchenWorkflow(
            tenantWorkflow?.EnableKitchenWorkflow ?? true,
            branch.EnableKitchenWorkflowOverride
        );
        var allowDirectTakeout = KitchenWorkflowPolicy.ResolveDirectCounterTakeoutDelivery(
            tenantWorkflow?.AllowDirectCounterTakeoutDelivery ?? true,
            branch.AllowDirectCounterTakeoutDeliveryOverride
        );

        return Result.Success(new UpdateBranchOperatingHoursResponse(
            branch.Id,
            branch.Name,
            branch.OpeningTime,
            branch.ClosingTime,
            branch.IsActive,
            branch.DeliveryRadiusKm,
            branch.IsCoverageStrict,
            branch.EnableKitchenWorkflowOverride,
            useKitchenWorkflow,
            branch.AllowDirectCounterTakeoutDeliveryOverride,
            allowDirectTakeout
        ));
    }
}
