using Delivery.Core.Common;
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

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new UpdateBranchOperatingHoursResponse(
            branch.Id,
            branch.Name,
            branch.OpeningTime,
            branch.ClosingTime,
            branch.IsActive
        ));
    }
}

