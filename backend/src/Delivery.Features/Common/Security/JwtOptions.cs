namespace Delivery.Features.Common.Security;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; set; } = "DeliveryPlatformSecretKeyVerySecureAtLeast256BitsLongForSha256!";
    public string Issuer { get; set; } = "DeliveryPlatform.Api";
    public string Audience { get; set; } = "DeliveryPlatform.Clients";
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}

