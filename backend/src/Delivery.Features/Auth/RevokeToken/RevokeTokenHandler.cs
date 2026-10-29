using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Features.Auth.RevokeToken;

public class RevokeTokenHandler : IHandler<RevokeTokenCommand, Result>
{
    private readonly AppDbContext _context;
    private readonly ITokenProvider _tokenProvider;

    public RevokeTokenHandler(AppDbContext context, ITokenProvider tokenProvider)
    {
        _context = context;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result> Handle(RevokeTokenCommand request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RawToken))
        {
            return Result.Success();
        }

        var tokenHash = _tokenProvider.HashToken(request.RawToken);

        var existingToken = await _context.RefreshTokens.IgnoreQueryFilters()
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (existingToken != null && !existingToken.RevokedAt.HasValue)
        {
            existingToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Success();
    }
}

