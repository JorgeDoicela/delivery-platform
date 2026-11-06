using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Delivery.Core.Common;
using Delivery.Features.Common.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Delivery.Features.Auth.GoogleAuth;

public partial class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleTokenValidator> _logger;

    public GoogleTokenValidator(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GoogleTokenValidator> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Result<GoogleTokenPayload>> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            return Result.Failure<GoogleTokenPayload>(AuthErrors.InvalidGoogleToken);
        }

        // Modo de desarrollo/pruebas: si se envía un token simulado con prefijo dev-mock-google:
        if (idToken.StartsWith("dev-mock-google:", StringComparison.OrdinalIgnoreCase))
        {
            var parts = idToken.Split(':');
            var mockEmail = parts.Length > 1 && !string.IsNullOrWhiteSpace(parts[1]) ? parts[1].Trim() : "dev.google@example.com";
            var mockName = parts.Length > 2 && !string.IsNullOrWhiteSpace(parts[2]) ? parts[2].Trim() : "Usuario Google Dev";
            return Result.Success(new GoogleTokenPayload("dev-google-sub", mockEmail, mockName, null, true));
        }

        try
        {
            var client = _httpClientFactory.CreateClient("GoogleTokenValidator");
            var requestUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}";
            var response = await client.GetAsync(requestUrl, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                LogGoogleTokenRejected(_logger, response.StatusCode);
                return Result.Failure<GoogleTokenPayload>(AuthErrors.InvalidGoogleToken);
            }

            var json = await response.Content.ReadFromJsonAsync<GoogleTokenInfoResponse>(cancellationToken: cancellationToken);
            if (json == null || string.IsNullOrWhiteSpace(json.Email))
            {
                return Result.Failure<GoogleTokenPayload>(AuthErrors.InvalidGoogleToken);
            }

            if (!string.Equals(json.EmailVerified, "true", StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure<GoogleTokenPayload>(AuthErrors.GoogleEmailNotVerified);
            }

            // Si el desarrollador o administrador configuró Authentication:Google:ClientId, validar audiencia
            var configuredClientId = _configuration["Authentication:Google:ClientId"]
                ?? _configuration["GOOGLE_CLIENT_ID"];

            if (!string.IsNullOrWhiteSpace(configuredClientId) &&
                !string.Equals(json.Aud, configuredClientId, StringComparison.Ordinal) &&
                !string.Equals(json.Azp, configuredClientId, StringComparison.Ordinal))
            {
                LogAudienceMismatch(_logger, json.Aud);
                return Result.Failure<GoogleTokenPayload>(AuthErrors.InvalidGoogleToken);
            }

            var fullName = !string.IsNullOrWhiteSpace(json.Name)
                ? json.Name.Trim()
                : json.Email.Split('@')[0];

            return Result.Success(new GoogleTokenPayload(
                json.Sub,
                json.Email,
                fullName,
                json.Picture,
                true));
        }
        catch (Exception ex)
        {
            LogGoogleCommunicationError(_logger, ex);
            return Result.Failure<GoogleTokenPayload>(AuthErrors.InvalidGoogleToken);
        }
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Warning, Message = "Validación de Google ID Token rechazada por Google. HTTP Status: {StatusCode}")]
    private static partial void LogGoogleTokenRejected(ILogger logger, HttpStatusCode statusCode);

    [LoggerMessage(EventId = 2, Level = LogLevel.Warning, Message = "Audiencia de Google ID Token ({Aud}) no coincide con el ClientId configurado.")]
    private static partial void LogAudienceMismatch(ILogger logger, string? aud);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Error al comunicar con los servidores de autenticación de Google.")]
    private static partial void LogGoogleCommunicationError(ILogger logger, Exception ex);

    private sealed class GoogleTokenInfoResponse
    {
        [JsonPropertyName("sub")]
        public string Sub { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("email_verified")]
        public string EmailVerified { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }

        [JsonPropertyName("aud")]
        public string? Aud { get; set; }

        [JsonPropertyName("azp")]
        public string? Azp { get; set; }
    }
}
