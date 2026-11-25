using Delivery.Core.Common;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed record CreateWhatsAppChallengeCommand(string? TenantSlug = null);

public sealed class CreateWhatsAppChallengeHandler
    : IHandler<CreateWhatsAppChallengeCommand, Result<CreateWhatsAppChallengeResponse>>
{
    private const int ChallengeTtlSeconds = 300;

    private readonly AppDbContext _context;
    private readonly IWhatsAppAuthChallengeStore _challengeStore;
    private readonly IConfiguration _configuration;

    public CreateWhatsAppChallengeHandler(
        AppDbContext context,
        IWhatsAppAuthChallengeStore challengeStore,
        IConfiguration configuration)
    {
        _context = context;
        _challengeStore = challengeStore;
        _configuration = configuration;
    }

    public async Task<Result<CreateWhatsAppChallengeResponse>> Handle(
        CreateWhatsAppChallengeCommand request,
        CancellationToken cancellationToken = default)
    {
        var brandName = "Mesafy";
        string? tenantContactPhone = null;

        if (!string.IsNullOrWhiteSpace(request.TenantSlug))
        {
            var slug = request.TenantSlug.Trim().ToLowerInvariant();
            var tenant = await _context.Tenants
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Include(t => t.Branches.Where(b => b.IsActive))
                .FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive, cancellationToken);

            if (tenant != null)
            {
                brandName = tenant.Name;
                tenantContactPhone = !string.IsNullOrWhiteSpace(tenant.ContactPhone)
                    ? tenant.ContactPhone
                    : tenant.Branches.FirstOrDefault(b => !string.IsNullOrWhiteSpace(b.Phone))?.Phone;
            }
        }
        else
        {
            var defaultTenant = await _context.Tenants
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Include(t => t.Branches.Where(b => b.IsActive))
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.Slug == "la-granjita")
                .FirstOrDefaultAsync(cancellationToken);

            if (defaultTenant != null)
            {
                tenantContactPhone = !string.IsNullOrWhiteSpace(defaultTenant.ContactPhone)
                    ? defaultTenant.ContactPhone
                    : defaultTenant.Branches.FirstOrDefault(b => !string.IsNullOrWhiteSpace(b.Phone))?.Phone;
            }
        }

        var configuredBotPhone =
            Environment.GetEnvironmentVariable("WHATSAPP_BOT_PHONE")
            ?? _configuration["WhatsAppChatbot:BotPhoneNumber"];

        var rawBotPhone = !string.IsNullOrWhiteSpace(configuredBotPhone)
            ? configuredBotPhone
            : tenantContactPhone;

        var normalizedBotPhone = WhatsAppOtpNormalizer.Normalize(rawBotPhone);
        if (string.IsNullOrWhiteSpace(normalizedBotPhone))
        {
            return Result.Failure<CreateWhatsAppChallengeResponse>(AuthErrors.WhatsAppBotNotConfigured);
        }

        var challenge = await _challengeStore.CreateChallengeAsync(
            request.TenantSlug,
            TimeSpan.FromSeconds(ChallengeTtlSeconds),
            cancellationToken);

        var prefilledMessage = $"Hola {brandName}, quiero iniciar sesión. Código: {challenge.ShortCode}";
        var whatsAppUrl = $"https://wa.me/{normalizedBotPhone}?text={Uri.EscapeDataString(prefilledMessage)}";

        return Result.Success(new CreateWhatsAppChallengeResponse(
            challenge.ChallengeId,
            challenge.ShortCode,
            whatsAppUrl,
            normalizedBotPhone,
            ChallengeTtlSeconds));
    }
}
