using System.Globalization;
using System.Security.Cryptography;
using Delivery.Core.Common;
using Delivery.Core.Contracts.WhatsApp;
using Delivery.Features.Common.Handlers;
using Delivery.Features.Common.Security;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Delivery.Features.Auth.WhatsAppOtp;

public sealed record RequestWhatsAppOtpCommand(string Phone, string? TenantSlug = null);

public sealed partial class RequestWhatsAppOtpHandler : IHandler<RequestWhatsAppOtpCommand, Result<RequestWhatsAppOtpResponse>>
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IWhatsAppClient _whatsAppClient;
    private readonly ILogger<RequestWhatsAppOtpHandler> _logger;

    public RequestWhatsAppOtpHandler(
        IConnectionMultiplexer redis,
        IWhatsAppClient whatsAppClient,
        ILogger<RequestWhatsAppOtpHandler> logger)
    {
        _redis = redis;
        _whatsAppClient = whatsAppClient;
        _logger = logger;
    }

    public async Task<Result<RequestWhatsAppOtpResponse>> Handle(RequestWhatsAppOtpCommand request, CancellationToken cancellationToken = default)
    {
        var normalized = WhatsAppOtpNormalizer.Normalize(request.Phone);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return Result.Failure<RequestWhatsAppOtpResponse>(AuthErrors.InvalidPhoneNumber);
        }

        var db = _redis.GetDatabase();

        // 1. Rate Limiting: máximo 3 solicitudes cada 10 minutos por número
        var rateLimitKey = $"auth:whatsapp:ratelimit:{normalized}";
        var currentRequests = await db.StringIncrementAsync(rateLimitKey);
        if (currentRequests == 1)
        {
            await db.KeyExpireAsync(rateLimitKey, TimeSpan.FromMinutes(10));
        }
        else if (currentRequests > 3)
        {
            return Result.Failure<RequestWhatsAppOtpResponse>(AuthErrors.OtpRateLimitExceeded);
        }

        // 2. Generación de código criptográficamente seguro de 6 dígitos
        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString(CultureInfo.InvariantCulture);

        // 3. Almacenamiento en Redis con TTL de 5 minutos
        var otpKey = $"auth:whatsapp:otp:{normalized}";
        await db.StringSetAsync(otpKey, code, TimeSpan.FromMinutes(5));

        // 4. Envío de mensaje vía WhatsApp Cloud API
        var message = $"Tu código de acceso para Mesafy es: *{code}*.\n\nVálido durante 5 minutos. No compartas este código con nadie.";
        var sent = await _whatsAppClient.SendTextMessageAsync(normalized, message, ct: cancellationToken);

        if (!sent)
        {
            LogDeliveryWarning(_logger, normalized, code);
        }
        else
        {
            LogOtpSent(_logger, normalized);
        }

        return Result.Success(new RequestWhatsAppOtpResponse(true, "Código de verificación enviado exitosamente a tu WhatsApp."));
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Warning, Message = "WhatsApp Cloud API no entregó el OTP para {Phone}. Código en logs: {Code}")]
    private static partial void LogDeliveryWarning(ILogger logger, string phone, string code);

    [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Código OTP enviado exitosamente por WhatsApp a {Phone}")]
    private static partial void LogOtpSent(ILogger logger, string phone);
}
