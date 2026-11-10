using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Chatbot.WhatsAppWebhook;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Delivery.UnitTests.Features.Chatbot;

public class CustomerConsentTrackerTests
{
    private readonly Mock<IConversationStore> _storeMock;
    private readonly Mock<ILogger<CustomerConsentTracker>> _loggerMock;

    public CustomerConsentTrackerTests()
    {
        _storeMock = new Mock<IConversationStore>();
        _loggerMock = new Mock<ILogger<CustomerConsentTracker>>();
    }

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task HasConsentAsync_WhenInRedisCache_ReturnsTrueWithoutDbCall()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phone = "593987654321";
        using var db = CreateInMemoryDbContext();

        _storeMock.Setup(s => s.GetCachedConsentAsync(tenantId, phone, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var tracker = new CustomerConsentTracker(db, _storeMock.Object, _loggerMock.Object);

        // Act
        var result = await tracker.HasConsentAsync(tenantId, phone);

        // Assert
        result.Should().BeTrue();
        _storeMock.Verify(s => s.SetCachedConsentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task HasConsentAsync_WhenCacheMissAndExistsInDb_CachesAndReturnsTrue()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phone = "593987654321";
        using var db = CreateInMemoryDbContext();

        db.CustomerConsents.Add(new CustomerConsent
        {
            TenantId = tenantId,
            PhoneNumber = phone,
            Channel = "WHATSAPP",
            ConsentVersion = "1.0",
            AcceptedAt = DateTime.UtcNow,
            IsRevoked = false
        });
        await db.SaveChangesAsync();

        _storeMock.Setup(s => s.GetCachedConsentAsync(tenantId, phone, It.IsAny<CancellationToken>()))
            .ReturnsAsync((bool?)null);

        var tracker = new CustomerConsentTracker(db, _storeMock.Object, _loggerMock.Object);

        // Act
        var result = await tracker.HasConsentAsync(tenantId, phone);

        // Assert
        result.Should().BeTrue();
        _storeMock.Verify(s => s.SetCachedConsentAsync(tenantId, phone, true, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HasConsentAsync_WhenCacheMissAndNotInDb_CachesAndReturnsFalse()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phone = "593987654321";
        using var db = CreateInMemoryDbContext();

        _storeMock.Setup(s => s.GetCachedConsentAsync(tenantId, phone, It.IsAny<CancellationToken>()))
            .ReturnsAsync((bool?)null);

        var tracker = new CustomerConsentTracker(db, _storeMock.Object, _loggerMock.Object);

        // Act
        var result = await tracker.HasConsentAsync(tenantId, phone);

        // Assert
        result.Should().BeFalse();
        _storeMock.Verify(s => s.SetCachedConsentAsync(tenantId, phone, false, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RegisterConsentAsync_SavesConsentInDbAndSetsRedisCache()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phone = "593987654321";
        var messageId = "wamid.msg_test_1";
        using var db = CreateInMemoryDbContext();

        var tracker = new CustomerConsentTracker(db, _storeMock.Object, _loggerMock.Object);

        // Act
        await tracker.RegisterConsentAsync(tenantId, phone, messageId);

        // Assert
        var saved = await db.CustomerConsents.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.PhoneNumber == phone);
        saved.Should().NotBeNull();
        saved!.IsRevoked.Should().BeFalse();
        saved.Channel.Should().Be("WHATSAPP");

        _storeMock.Verify(s => s.SetCachedConsentAsync(tenantId, phone, true, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RevokeConsentAsync_MarksActiveConsentsAsRevokedAndUpdatesCache()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phone = "593987654321";
        using var db = CreateInMemoryDbContext();

        db.CustomerConsents.Add(new CustomerConsent
        {
            TenantId = tenantId,
            PhoneNumber = phone,
            Channel = "WHATSAPP",
            ConsentVersion = "1.0",
            AcceptedAt = DateTime.UtcNow,
            IsRevoked = false
        });
        await db.SaveChangesAsync();

        var tracker = new CustomerConsentTracker(db, _storeMock.Object, _loggerMock.Object);

        // Act
        await tracker.RevokeConsentAsync(tenantId, phone);

        // Assert
        var updated = await db.CustomerConsents.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.PhoneNumber == phone);
        updated.Should().NotBeNull();
        updated!.IsRevoked.Should().BeTrue();
        updated.RevokedAt.Should().NotBeNull();

        _storeMock.Verify(s => s.RevokeCachedConsentAsync(tenantId, phone, It.IsAny<CancellationToken>()), Times.Once);
    }
}

