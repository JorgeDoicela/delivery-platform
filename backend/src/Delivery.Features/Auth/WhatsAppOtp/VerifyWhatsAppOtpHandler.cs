using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using StackExchange.Redis;

namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed record VerifyWhatsAppOtpCommand(string Phone, string Code, string? TenantSlug = null);

public sealed class VerifyWhatsAppOtpHandler : IHandler<VerifyWhatsAppOtpCommand, Result<WhatsAppLoginResponse>>
{
    private const int MaxVerifyAttempts = 5;

    private readonly AppDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenProvider _tokenProvider;

    public VerifyWhatsAppOtpHandler(
        AppDbContext context,
        IConnectionMultiplexer redis,
        IPasswordHasher passwordHasher,
        ITokenProvider tokenProvider)
    {
        _context = context;
        _redis = redis;
        _passwordHasher = passwordHasher;
        _tokenProvider = tokenProvider;
    }

    public async Task<Result<WhatsAppLoginResponse>> Handle(VerifyWhatsAppOtpCommand request, CancellationToken cancellationToken = default)
    {
        var normalized = WhatsAppOtpNormalizer.Normalize(request.Phone);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return Result.Failure<WhatsAppLoginResponse>(AuthErrors.InvalidPhoneNumber);
        }

        var db = _redis.GetDatabase();
        var otpKey = $"auth:whatsapp:otp:{normalized}";
        var attemptsKey = $"auth:whatsapp:otp:attempts:{normalized}";
        var storedCode = await db.StringGetAsync(otpKey);

        if (!storedCode.HasValue || string.IsNullOrWhiteSpace(request.Code) || storedCode.ToString() != request.Code.Trim())
        {
            var attempts = await db.StringIncrementAsync(attemptsKey);
            if (attempts == 1)
            {
                await db.KeyExpireAsync(attemptsKey, TimeSpan.FromMinutes(5));
            }
            else if (attempts >= MaxVerifyAttempts)
            {
                await db.KeyDeleteAsync(otpKey);
                await db.KeyDeleteAsync(attemptsKey);
                return Result.Failure<WhatsAppLoginResponse>(AuthErrors.OtpRateLimitExceeded);
            }

            return Result.Failure<WhatsAppLoginResponse>(AuthErrors.InvalidOtpCode);
        }

        // Una vez verificado, invalidar el OTP y el contador en Redis para prevenir reuso
        await db.KeyDeleteAsync(otpKey);
        await db.KeyDeleteAsync(attemptsKey);

        return await WhatsAppUserProvisioner.AuthenticateOrProvisionAsync(
            _context,
            _passwordHasher,
            _tokenProvider,
            normalized,
            null,
            request.TenantSlug,
            cancellationToken);
    }
}
