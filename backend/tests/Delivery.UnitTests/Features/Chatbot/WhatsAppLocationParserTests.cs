using Delivery.Features.Chatbot.WhatsAppWebhook;
using FluentAssertions;
using Xunit;

namespace Delivery.UnitTests.Features.Chatbot;

public class WhatsAppLocationParserTests
{
    [Fact]
    public void ExtractLocation_WithNativeLocationMessage_ReturnsParsedLocation()
    {
        // Arrange
        var incoming = new WhatsAppIncomingMessage
        {
            Type = "location",
            From = "593987654321",
            Id = "wamid.123",
            Location = new WhatsAppLocationMessage
            {
                Latitude = -0.3323,
                Longitude = -78.5571,
                Name = "Mi Domicilio",
                Address = "Av. Maldonado y Guamaní",
                IsLive = false
            }
        };

        // Act
        var result = WhatsAppLocationParser.ExtractLocation(incoming);

        // Assert
        result.Should().NotBeNull();
        result!.Latitude.Should().Be(-0.3323);
        result.Longitude.Should().Be(-78.5571);
        result.Name.Should().Be("Mi Domicilio");
        result.Address.Should().Be("Av. Maldonado y Guamaní");
        result.IsLiveLocation.Should().BeFalse();
    }

    [Fact]
    public void ExtractLocation_WithNativeLiveLocation_MarksIsLiveTrue()
    {
        // Arrange
        var incoming = new WhatsAppIncomingMessage
        {
            Type = "location",
            From = "593987654321",
            Id = "wamid.456",
            Location = new WhatsAppLocationMessage
            {
                Latitude = -0.3323,
                Longitude = -78.5571,
                IsLive = true
            }
        };

        // Act
        var result = WhatsAppLocationParser.ExtractLocation(incoming);

        // Assert
        result.Should().NotBeNull();
        result!.IsLiveLocation.Should().BeTrue();
    }

    [Theory]
    [InlineData("Aquí está mi ubicación https://maps.google.com/?q=-0.29381,-78.54921", -0.29381, -78.54921, false)]
    [InlineData("Te paso en tiempo real https://www.google.com/maps?q=-0.29381,-78.54921", -0.29381, -78.54921, true)]
    [InlineData("Revisa mi gps maps.apple.com/?ll=-0.1800,-78.4800", -0.1800, -78.4800, false)]
    [InlineData("geo:-0.3500,-78.5000", -0.3500, -78.5000, false)]
    [InlineData("Ubicación en vivo: -0.3323, -78.5571", -0.3323, -78.5571, true)]
    public void ExtractLocation_WithTextMessageLinksAndCoordinates_DetectsAccurately(
        string messageText, double expectedLat, double expectedLng, bool expectedLive)
    {
        // Arrange
        var incoming = new WhatsAppIncomingMessage
        {
            Type = "text",
            From = "593987654321",
            Id = "wamid.789",
            Text = new WhatsAppTextMessage { Body = messageText }
        };

        // Act
        var result = WhatsAppLocationParser.ExtractLocation(incoming);

        // Assert
        result.Should().NotBeNull();
        result!.Latitude.Should().BeApproximately(expectedLat, 0.0001);
        result.Longitude.Should().BeApproximately(expectedLng, 0.0001);
        result.IsLiveLocation.Should().Be(expectedLive);
    }

    [Fact]
    public void ExtractLocation_WithPureTextNoLocation_ReturnsNull()
    {
        // Arrange
        var incoming = new WhatsAppIncomingMessage
        {
            Type = "text",
            From = "593987654321",
            Id = "wamid.000",
            Text = new WhatsAppTextMessage { Body = "Hola, ¿tienen pollo asado disponible?" }
        };

        // Act
        var result = WhatsAppLocationParser.ExtractLocation(incoming);

        // Assert
        result.Should().BeNull();
    }
}
