using Delivery.Core.Common;
using Delivery.Core.Contracts.Storage;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Account;
using Delivery.Features.Common.Handlers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Delivery.Features.Account.UploadAvatar;

public sealed record DeleteAvatarCommand(Guid UserId);

public sealed class DeleteAvatarHandler : IHandler<DeleteAvatarCommand, Result<bool>>
{
    private readonly AppDbContext _context;
    private readonly IAvatarStorage _storageService;
    private readonly ILogger<DeleteAvatarHandler> _logger;

    public DeleteAvatarHandler(
        AppDbContext context,
        IAvatarStorage storageService,
        ILogger<DeleteAvatarHandler> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeleteAvatarCommand request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<bool>(AccountErrors.UserNotFound);
        }

        if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
        {
            await _storageService.DeleteAvatarAsync(user.AvatarUrl, cancellationToken);
            user.AvatarUrl = null;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Success(true);
    }
}

