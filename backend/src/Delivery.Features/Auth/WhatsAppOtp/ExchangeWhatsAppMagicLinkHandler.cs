using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;

namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed record ExchangeWhatsAppMagicLinkCommand(string Token, string? TenantSlug = null);

public sealed class ExchangeWhatsAppMagicLinkHandler
    : IHandler<ExchangeWhatsAppMagicLinkCommand, Result<ExchangeWhatsAppMagicLinkResponse>>
{
    private readonly AppDbContext _context;
    private readonly IWhatsAppAuthChallengeStore _challengeStore;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenProvider _tokenProvider;

    public ExchangeWhatsAppMagicLinkHandler(
        AppDbContext context,
        IWhatsAppAuthChallengeStore challengeStore,
        IPasswordHasher passwordHasher,
        ITokenProvider tokenProvider)
    {
        _context = context;
        _challengeStore = challengeStore;
        _passwordHasher = passwordHasher;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result<ExchangeWhatsAppMagicLinkResponse>> Handle(
        ExchangeWhatsAppMagicLinkCommand request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return Result.Failure<ExchangeWhatsAppMagicLinkResponse>(AuthErrors.InvalidOrExpiredMagicLink);
        }

        var payload = await _challengeStore.ConsumeMagicLinkAsync(request.Token, cancellationToken);
        if (payload is null || string.IsNullOrWhiteSpace(payload.Phone))
        {
            return Result.Failure<ExchangeWhatsAppMagicLinkResponse>(AuthErrors.InvalidOrExpiredMagicLink);
        }

        var effectiveSlug = !string.IsNullOrWhiteSpace(payload.TenantSlug)
            ? payload.TenantSlug
            : request.TenantSlug;

        var authResult = await WhatsAppUserProvisioner.AuthenticateOrProvisionAsync(
            _context,
            _passwordHasher,
            _tokenProvider,
            payload.Phone,
            payload.ContactName,
            effectiveSlug,
            cancellationToken);

        if (authResult.IsFailure)
        {
            return Result.Failure<ExchangeWhatsAppMagicLinkResponse>(authResult.Error);
        }

        return Result.Success(new ExchangeWhatsAppMagicLinkResponse(
            authResult.Value.AccessToken,
            authResult.Value.RefreshToken,
            authResult.Value.ExpiresAt,
            authResult.Value.User,
            payload.RedirectPath));
    }
}
