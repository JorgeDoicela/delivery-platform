using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;

namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed record PollWhatsAppChallengeQuery(string ChallengeId);

public sealed class PollWhatsAppChallengeHandler
    : IHandler<PollWhatsAppChallengeQuery, Result<PollWhatsAppChallengeResponse>>
{
    private readonly AppDbContext _context;
    private readonly IWhatsAppAuthChallengeStore _challengeStore;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenProvider _tokenProvider;

    public PollWhatsAppChallengeHandler(
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

    public async Task<Result<PollWhatsAppChallengeResponse>> Handle(
        PollWhatsAppChallengeQuery request,
        CancellationToken cancellationToken = default)
    {
        var challenge = await _challengeStore.GetChallengeAsync(request.ChallengeId, cancellationToken);
        if (challenge is null)
        {
            return Result.Success(new PollWhatsAppChallengeResponse("expired"));
        }

        if (challenge.Status == "pending")
        {
            return Result.Success(new PollWhatsAppChallengeResponse("pending"));
        }

        if (challenge.Status != "verified" || string.IsNullOrWhiteSpace(challenge.VerifiedPhone))
        {
            return Result.Success(new PollWhatsAppChallengeResponse("expired"));
        }

        var consumed = await _challengeStore.ConsumeVerifiedChallengeAsync(request.ChallengeId, cancellationToken);
        if (consumed is null || string.IsNullOrWhiteSpace(consumed.VerifiedPhone))
        {
            return Result.Success(new PollWhatsAppChallengeResponse("expired"));
        }

        var authResult = await WhatsAppUserProvisioner.AuthenticateOrProvisionAsync(
            _context,
            _passwordHasher,
            _tokenProvider,
            consumed.VerifiedPhone,
            consumed.ContactName,
            consumed.TenantSlug,
            cancellationToken);

        if (authResult.IsFailure)
        {
            return Result.Failure<PollWhatsAppChallengeResponse>(authResult.Error);
        }

        return Result.Success(new PollWhatsAppChallengeResponse(
            "authenticated",
            authResult.Value.AccessToken,
            authResult.Value.RefreshToken,
            authResult.Value.ExpiresAt,
            authResult.Value.User));
    }
}
