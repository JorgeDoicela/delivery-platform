using Delivery.Core.Contracts.WhatsApp;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.WhatsAppOtp;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using Xunit;
using RoleEntity = Delivery.Core.Domain.Entities.Role;

namespace Delivery.UnitTests.Features.Auth;

public class WhatsAppOtpTests
{
    [Theory]
    [InlineData("0998877665", "593998877665")]
    [InlineData("+593998877665", "593998877665")]
    [InlineData("593998877665", "593998877665")]
    [InlineData("09 988 77665", "593998877665")]
    [InlineData("123", null)]
    [InlineData("", null)]
    [InlineData(null, null)]
    public void WhatsAppOtpNormalizer_NormalizesEcuadorianAndInternationalPhones(string? raw, string? expected)
    {
        var result = WhatsAppOtpNormalizer.Normalize(raw);
        result.Should().Be(expected);
    }

    [Fact]
    public async Task RequestWhatsAppOtpHandler_ShouldFail_WhenPhoneIsInvalid()
    {
        var mockRedis = new Mock<IConnectionMultiplexer>();
        var mockClient = new Mock<IWhatsAppClient>();
        var mockLogger = new Mock<ILogger<RequestWhatsAppOtpHandler>>();

        var handler = new RequestWhatsAppOtpHandler(mockRedis.Object, mockClient.Object, mockLogger.Object);
        var result = await handler.Handle(new RequestWhatsAppOtpCommand("123"));

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Auth.InvalidPhoneNumber");
    }

    [Fact]
    public async Task RequestWhatsAppOtpHandler_ShouldStoreCodeAndSendWhatsAppMessage()
    {
        var mockDb = new Mock<IDatabase>();
        mockDb.Setup(d => d.StringIncrementAsync(It.IsAny<RedisKey>(), It.IsAny<long>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(1);
        mockDb.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<bool>(), It.IsAny<When>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(true);

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(mockDb.Object);

        var mockClient = new Mock<IWhatsAppClient>();
        mockClient.Setup(c => c.SendTextMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var mockLogger = new Mock<ILogger<RequestWhatsAppOtpHandler>>();

        var handler = new RequestWhatsAppOtpHandler(mockRedis.Object, mockClient.Object, mockLogger.Object);
        var result = await handler.Handle(new RequestWhatsAppOtpCommand("0998877665"));

        result.IsSuccess.Should().BeTrue();
        result.Value.Success.Should().BeTrue();

        mockDb.Verify(d => d.StringSetAsync(
            It.Is<RedisKey>(k => k.ToString().Contains("593998877665")),
            It.IsAny<RedisValue>(),
            It.Is<TimeSpan?>(ts => ts.HasValue && ts.Value.TotalMinutes == 5),
            It.IsAny<bool>(),
            It.IsAny<When>(),
            It.IsAny<CommandFlags>()), Times.Once);

        mockClient.Verify(c => c.SendTextMessageAsync("593998877665", It.IsAny<string>(), null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifyWhatsAppOtpHandler_ShouldFail_WhenCodeIsExpiredOrInvalid()
    {
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(dbName).Options;
        await using var context = new AppDbContext(options);

        var mockDb = new Mock<IDatabase>();
        mockDb.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(mockDb.Object);

        var mockHasher = new Mock<IPasswordHasher>();
        var mockTokenProvider = new Mock<ITokenProvider>();

        var handler = new VerifyWhatsAppOtpHandler(context, mockRedis.Object, mockHasher.Object, mockTokenProvider.Object);
        var result = await handler.Handle(new VerifyWhatsAppOtpCommand("0998877665", "123456"));

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Auth.InvalidOtpCode");
    }

    [Fact]
    public async Task VerifyWhatsAppOtpHandler_ShouldSucceed_AndProvisionUser_WhenCodeMatches()
    {
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(dbName).Options;
        await using var context = new AppDbContext(options);
        await DatabaseSeeder.SeedAsync(context);

        var mockDb = new Mock<IDatabase>();
        mockDb.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(new RedisValue("654321"));
        mockDb.Setup(d => d.KeyDeleteAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(true);

        var mockRedis = new Mock<IConnectionMultiplexer>();
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(mockDb.Object);

        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash_random_pwd");

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<RoleEntity>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("access_token_otp_test", DateTime.UtcNow.AddHours(1)));
        mockTokenProvider.Setup(t => t.GenerateRefreshToken())
            .Returns(("raw_refresh_test", "hash_refresh_test", DateTime.UtcNow.AddDays(7)));

        var handler = new VerifyWhatsAppOtpHandler(context, mockRedis.Object, mockHasher.Object, mockTokenProvider.Object);
        var result = await handler.Handle(new VerifyWhatsAppOtpCommand("0998877665", "654321", "la-granjita"));

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("access_token_otp_test");
        result.Value.User.Phone.Should().Be("593998877665");
        result.Value.User.Role.Should().Be("Customer");

        var createdUser = await context.Users.FirstOrDefaultAsync(u => u.Phone == "593998877665");
        createdUser.Should().NotBeNull();
        createdUser!.Email.Should().Contain("593998877665");
    }
}
