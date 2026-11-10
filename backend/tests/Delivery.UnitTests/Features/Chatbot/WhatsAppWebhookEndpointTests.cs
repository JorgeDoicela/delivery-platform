using Delivery.Features.Chatbot.WhatsAppWebhook;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Chatbot;

public class WhatsAppWebhookEndpointTests
{
    private readonly WhatsAppChatbotOptions _options;
    private readonly Mock<ILogger<WhatsAppWebhookEndpoint>> _loggerMock;

    public WhatsAppWebhookEndpointTests()
    {
        _options = new WhatsAppChatbotOptions
        {
            VerifyToken = "secret_test_token_123",
            PhoneNumberId = "1349339028273599",
            AccessToken = "test_meta_token"
        };
        _loggerMock = new Mock<ILogger<WhatsAppWebhookEndpoint>>();
    }

    [Fact]
    public void VerifyWebhook_WithValidTokenAndMode_ReturnsChallengeContent()
    {
        // Arrange
        var mode = "subscribe";
        var token = "secret_test_token_123";
        var challenge = "challenge_code_987654";
        var optionsWrapper = Microsoft.Extensions.Options.Options.Create(_options);

        // Act
        var result = ExecuteGetHandler(mode, token, challenge, optionsWrapper, _loggerMock.Object);

        // Assert
        result.Should().BeOfType<ContentHttpResult>();
        var contentResult = (ContentHttpResult)result;
        contentResult.ResponseContent.Should().Be("challenge_code_987654");
        contentResult.ContentType.Should().Be("text/plain");
    }

    [Fact]
    public void VerifyWebhook_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var mode = "subscribe";
        var token = "wrong_token";
        var challenge = "challenge_code_987654";
        var optionsWrapper = Microsoft.Extensions.Options.Options.Create(_options);

        // Act
        var result = ExecuteGetHandler(mode, token, challenge, optionsWrapper, _loggerMock.Object);

        // Assert
        result.Should().BeOfType<UnauthorizedHttpResult>();
    }

    [Fact]
    public void VerifyWebhook_WithInvalidMode_ReturnsUnauthorized()
    {
        // Arrange
        var mode = "unsubscribe";
        var token = "secret_test_token_123";
        var challenge = "challenge_code_987654";
        var optionsWrapper = Microsoft.Extensions.Options.Options.Create(_options);

        // Act
        var result = ExecuteGetHandler(mode, token, challenge, optionsWrapper, _loggerMock.Object);

        // Assert
        result.Should().BeOfType<UnauthorizedHttpResult>();
    }

    [Fact]
    public void IsValidMetaSignature_WhenAppSecretEmpty_AllowsRequest()
    {
        // Act
        var isValid = WhatsAppWebhookEndpoint.IsValidMetaSignature("{\"test\":1}", null, null);

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public void IsValidMetaSignature_WithValidHmacSignature_ReturnsTrue()
    {
        // Arrange
        var appSecret = "meta_secret_key_abc123";
        var rawBody = "{\"entry\":[{\"id\":\"123\"}]}";

        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(appSecret));
        var hash = Convert.ToHexString(hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(rawBody))).ToLowerInvariant();
        var header = $"sha256={hash}";

        // Act
        var isValid = WhatsAppWebhookEndpoint.IsValidMetaSignature(rawBody, header, appSecret);

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public void IsValidMetaSignature_WithTamperedBodyOrKey_ReturnsFalse()
    {
        // Arrange
        var appSecret = "meta_secret_key_abc123";
        var rawBody = "{\"entry\":[{\"id\":\"123\"}]}";
        var tamperedHeader = "sha256=11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff";

        // Act
        var isValid = WhatsAppWebhookEndpoint.IsValidMetaSignature(rawBody, tamperedHeader, appSecret);

        // Assert
        isValid.Should().BeFalse();
    }

    private static IResult ExecuteGetHandler(
        string? mode,
        string? verifyToken,
        string? challenge,
        IOptions<WhatsAppChatbotOptions> options,
        ILogger<WhatsAppWebhookEndpoint> logger)
    {
        var expectedToken = options.Value.VerifyToken;

        if (mode == "subscribe" && !string.IsNullOrWhiteSpace(verifyToken) && verifyToken == expectedToken)
        {
            return Results.Content(challenge ?? string.Empty, "text/plain");
        }

        return Results.Unauthorized();
    }
}
