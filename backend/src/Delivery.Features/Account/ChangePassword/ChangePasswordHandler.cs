using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Account.ChangePassword;

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmPassword
);

public sealed record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword,
    string ConfirmPassword
);

public sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("La contraseña actual es requerida.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("La nueva contraseña es requerida.")
            .MinimumLength(6).WithMessage("La nueva contraseña debe tener al menos 6 caracteres.")
            .MaximumLength(100).WithMessage("La nueva contraseña no puede exceder 100 caracteres.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("La nueva contraseña y su confirmación no coinciden.");
    }
}

public sealed class ChangePasswordHandler : IHandler<ChangePasswordCommand, Result<string>>
{
    private readonly AppDbContext _context;
    private readonly IValidator<ChangePasswordCommand> _validator;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordHandler(
        AppDbContext context,
        IValidator<ChangePasswordCommand> validator,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _validator = validator;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<string>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken = default)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return Result.Failure<string>(new Error(first.ErrorCode, first.ErrorMessage));
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<string>(AccountErrors.UserNotFound);
        }

        if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return Result.Failure<string>(AccountErrors.InvalidCurrentPassword);
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);

        // Revocar sesiones de refresh token anteriores por seguridad
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var rt in activeTokens)
        {
            rt.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Tu contraseña ha sido actualizada correctamente.");
    }
}
