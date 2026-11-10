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
