using Delivery.Core.Contracts.WhatsApp;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Auth.WhatsAppOtp;
using Delivery.Features.Common.Security;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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

        var createdCustomer = await context.Customers.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Phone == "593998877665");
        createdCustomer.Should().NotBeNull();
    }

    [Fact]
    public async Task RequestWhatsAppOtpHandler_ShouldFail_WhenWhatsAppApiReturnsFalse()
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
            .ReturnsAsync(false);

        var mockLogger = new Mock<ILogger<RequestWhatsAppOtpHandler>>();
        var handler = new RequestWhatsAppOtpHandler(mockRedis.Object, mockClient.Object, mockLogger.Object);

        var result = await handler.Handle(new RequestWhatsAppOtpCommand("0998877665"));

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("Auth.WhatsAppDeliveryFailed");
    }

    [Fact]
    public async Task CreateWhatsAppChallengeHandler_ShouldCreateChallengeAndBuildWaMeUrl()
    {
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(dbName).Options;
        await using var context = new AppDbContext(options);
        await DatabaseSeeder.SeedAsync(context);

        var mockStore = new Mock<IWhatsAppAuthChallengeStore>();
        mockStore.Setup(s => s.CreateChallengeAsync("la-granjita", It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WhatsAppAuthChallenge("chg_abc123", "K7M9P2", "pending", "la-granjita", null, null, DateTime.UtcNow));

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WhatsAppChatbot:BotPhoneNumber"] = "593991234567"
            })
            .Build();

        var handler = new CreateWhatsAppChallengeHandler(context, mockStore.Object, config);
        var result = await handler.Handle(new CreateWhatsAppChallengeCommand("la-granjita"));

        result.IsSuccess.Should().BeTrue();
        result.Value.ChallengeId.Should().Be("chg_abc123");
        result.Value.ShortCode.Should().Be("K7M9P2");
        result.Value.WhatsAppUrl.Should().StartWith("https://wa.me/593991234567?text=");
        result.Value.WhatsAppUrl.Should().Contain("K7M9P2");
    }

    [Fact]
    public async Task PollWhatsAppChallengeHandler_ShouldReturnAuthenticated_WhenVerified()
    {
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(dbName).Options;
        await using var context = new AppDbContext(options);
        await DatabaseSeeder.SeedAsync(context);

        var verifiedChallenge = new WhatsAppAuthChallenge(
            "chg_verified",
            "K7M9P2",
            "verified",
            "la-granjita",
            "593991112233",
            "Carlos Perez",
            DateTime.UtcNow);

        var mockStore = new Mock<IWhatsAppAuthChallengeStore>();
        mockStore.Setup(s => s.GetChallengeAsync("chg_verified", It.IsAny<CancellationToken>()))
            .ReturnsAsync(verifiedChallenge);
        mockStore.Setup(s => s.ConsumeVerifiedChallengeAsync("chg_verified", It.IsAny<CancellationToken>()))
            .ReturnsAsync(verifiedChallenge);

        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash_pwd");

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<RoleEntity>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("access_inbound_token", DateTime.UtcNow.AddHours(1)));
        mockTokenProvider.Setup(t => t.GenerateRefreshToken())
            .Returns(("raw_refresh", "hash_refresh", DateTime.UtcNow.AddDays(7)));

        var handler = new PollWhatsAppChallengeHandler(context, mockStore.Object, mockHasher.Object, mockTokenProvider.Object);
        var result = await handler.Handle(new PollWhatsAppChallengeQuery("chg_verified"));

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be("authenticated");
        result.Value.AccessToken.Should().Be("access_inbound_token");
        result.Value.User!.FullName.Should().Be("Carlos Perez");
        result.Value.User.Phone.Should().Be("593991112233");
    }

    [Fact]
    public async Task ExchangeWhatsAppMagicLinkHandler_ShouldAuthenticateAndReturnRedirectPath()
    {
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(dbName).Options;
        await using var context = new AppDbContext(options);
        await DatabaseSeeder.SeedAsync(context);

        var mockStore = new Mock<IWhatsAppAuthChallengeStore>();
        mockStore.Setup(s => s.ConsumeMagicLinkAsync("magic_tok_123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WhatsAppMagicLinkPayload("593988776655", "Ana Lopez", "la-granjita", "/menu", DateTime.UtcNow));

        var mockHasher = new Mock<IPasswordHasher>();
        mockHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hash_pwd");

        var mockTokenProvider = new Mock<ITokenProvider>();
        mockTokenProvider.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<RoleEntity>>(), It.IsAny<Guid?>(), It.IsAny<int?>()))
            .Returns(("access_magic_token", DateTime.UtcNow.AddHours(1)));
        mockTokenProvider.Setup(t => t.GenerateRefreshToken())
            .Returns(("raw_refresh", "hash_refresh", DateTime.UtcNow.AddDays(7)));

        var handler = new ExchangeWhatsAppMagicLinkHandler(context, mockStore.Object, mockHasher.Object, mockTokenProvider.Object);
        var result = await handler.Handle(new ExchangeWhatsAppMagicLinkCommand("magic_tok_123", "la-granjita"));

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("access_magic_token");
        result.Value.RedirectPath.Should().Be("/menu");
        result.Value.User.FullName.Should().Be("Ana Lopez");
    }
}
