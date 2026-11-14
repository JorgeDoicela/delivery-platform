using Delivery.Core.Contracts.Realtime;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Chatbot.WhatsAppWebhook;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NetTopologySuite.Geometries;
using StackExchange.Redis;
using Xunit;
using Order = Delivery.Core.Domain.Entities.Order;

namespace Delivery.UnitTests.Features.Chatbot;

public class WhatsAppOrderLocationProcessorTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    private readonly Mock<ITenantKnowledgeProvider> _knowledgeMock;
    private readonly Mock<IConversationStore> _storeMock;
    private readonly Mock<ITrackingNotifier> _trackingNotifierMock;
    private readonly Mock<IKitchenNotifier> _kitchenNotifierMock;
    private readonly Mock<IWhatsAppClient> _senderMock;
    private readonly Mock<ILogger<WhatsAppOrderLocationProcessor>> _loggerMock;
    private readonly Mock<IConnectionMultiplexer> _redisMock;
    private readonly Mock<IDatabase> _redisDbMock;
    private readonly WhatsAppChatbotOptions _options;

    public WhatsAppOrderLocationProcessorTests()
    {
        _knowledgeMock = new Mock<ITenantKnowledgeProvider>();
        _storeMock = new Mock<IConversationStore>();
        _trackingNotifierMock = new Mock<ITrackingNotifier>();
        _kitchenNotifierMock = new Mock<IKitchenNotifier>();
        _senderMock = new Mock<IWhatsAppClient>();
        _loggerMock = new Mock<ILogger<WhatsAppOrderLocationProcessor>>();
        _redisMock = new Mock<IConnectionMultiplexer>();
        _redisDbMock = new Mock<IDatabase>();

        _redisMock.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(_redisDbMock.Object);

        _options = new WhatsAppChatbotOptions
        {
            PlatformDomain = "mesafy.doicela.dev"
        };
    }

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleLocationAsync_WithActiveOrderInsideCoverage_UpdatesOrderLocationAndDispatchesSignalR()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = tenantId, Name = "La Granjita", Slug = "la-granjita" };
        db.Tenants.Add(tenant);

        var branchLocation = GeometryFactory.CreatePoint(new Coordinate(-78.55708, -0.33228));
        var shell = new[]
        {
            new Coordinate(-78.60, -0.40),
            new Coordinate(-78.50, -0.40),
            new Coordinate(-78.50, -0.20),
            new Coordinate(-78.60, -0.20),
            new Coordinate(-78.60, -0.40)
        };
        var branchPolygon = GeometryFactory.CreatePolygon(shell);

        var branch = new Branch
        {
            Id = 1,
            TenantId = tenantId,
            Name = "Sucursal Guamaní",
            Address = "Av. Maldonado 100",
            Phone = "0987654321",
            IsActive = true,
            LocationPoint = branchLocation,
            CoveragePolygon = branchPolygon,
            DeliveryRadiusKm = 10
        };
        db.Branches.Add(branch);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            OrderNumber = 1001,
            CustomerName = "Jorge Doicela",
            CustomerPhone = "593987654321",
            Status = OrderStatus.InKitchen,
            BranchId = 1,
            CreatedAt = DateTime.UtcNow
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant, SystemPrompt = "test" });

        var processor = new WhatsAppOrderLocationProcessor(
            db,
            _knowledgeMock.Object,
            _storeMock.Object,
            _trackingNotifierMock.Object,
            _kitchenNotifierMock.Object,
            _senderMock.Object,
            Options.Create(_options),
            _loggerMock.Object,
            _redisMock.Object);

        var incoming = new WhatsAppIncomingMessage
        {
            From = "593987654321",
            Id = "wamid.location_001",
            Type = "location"
        };
        var location = new WhatsAppExtractedLocation(-0.3323, -78.5571, "Casa", "Calle Los Pinos 456", false);

        // Act
        var handled = await processor.HandleLocationAsync(incoming, location, "phone_id_123", "Jorge Doicela");

        // Assert
        handled.Should().BeTrue();

        var updatedOrder = await db.Orders.FirstOrDefaultAsync(o => o.Id == order.Id);
        updatedOrder.Should().NotBeNull();
        updatedOrder!.DeliveryLocation.Should().NotBeNull();
        updatedOrder.DeliveryLocation!.Y.Should().Be(-0.3323);
        updatedOrder.DeliveryLocation!.X.Should().Be(-78.5571);
        updatedOrder.AddressStreet.Should().Be("Calle Los Pinos 456");

        // Verificación de Push SignalR
        _trackingNotifierMock.Verify(t => t.NotifyCustomerLocationUpdatedAsync(
            order.Id, -0.3323, -78.5571, false, It.IsAny<CancellationToken>()), Times.Once);

        _kitchenNotifierMock.Verify(k => k.NotifyCustomerLocationUpdatedAsync(
            order.Id, branch.Id, -0.3323, -78.5571, false, It.IsAny<CancellationToken>()), Times.Once);

        // Verificación de confirmación WhatsApp
        _senderMock.Verify(s => s.SendTextMessageAsync(
            "593987654321",
            It.Is<string>(msg => msg.Contains("Pedido #1001") && msg.Contains("Sucursal Guamaní") && (msg.Contains("pedidos") || msg.Contains("rastreo"))),
            "phone_id_123",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleLocationAsync_WithLiveLocation_StoresRedisTelemetryAndMarksLiveTrue()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = tenantId, Name = "La Granjita", Slug = "la-granjita" };
        db.Tenants.Add(tenant);

        var branchLocation = GeometryFactory.CreatePoint(new Coordinate(-78.55708, -0.33228));
        var shell = new[]
        {
            new Coordinate(-78.60, -0.40),
            new Coordinate(-78.50, -0.40),
            new Coordinate(-78.50, -0.20),
            new Coordinate(-78.60, -0.20),
            new Coordinate(-78.60, -0.40)
        };
        var branch = new Branch
        {
            Id = 1,
            TenantId = tenantId,
            Name = "Sucursal Guamaní",
            LocationPoint = branchLocation,
            CoveragePolygon = GeometryFactory.CreatePolygon(shell),
            DeliveryRadiusKm = 10,
            IsActive = true
        };
        db.Branches.Add(branch);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            OrderNumber = 1002,
            CustomerPhone = "593987654321",
            Status = OrderStatus.OnTheWay,
            BranchId = 1,
            CreatedAt = DateTime.UtcNow
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant, SystemPrompt = "test" });

        var processor = new WhatsAppOrderLocationProcessor(
            db,
            _knowledgeMock.Object,
            _storeMock.Object,
            _trackingNotifierMock.Object,
            _kitchenNotifierMock.Object,
            _senderMock.Object,
            Options.Create(_options),
            _loggerMock.Object,
            _redisMock.Object);

        var incoming = new WhatsAppIncomingMessage
        {
            From = "593987654321",
            Id = "wamid.live_001",
            Type = "location"
        };
        var location = new WhatsAppExtractedLocation(-0.3323, -78.5571, null, null, true);

        // Act
        var handled = await processor.HandleLocationAsync(incoming, location, "phone_id_123", "Jorge");

        // Assert
        handled.Should().BeTrue();

        _redisDbMock.Verify(r => r.StringSetAsync(
            $"order:{order.Id}:live_location",
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            It.IsAny<bool>(),
            It.IsAny<When>(),
            It.IsAny<CommandFlags>()), Times.Once);

        _trackingNotifierMock.Verify(t => t.NotifyCustomerLocationUpdatedAsync(
            order.Id, -0.3323, -78.5571, true, It.IsAny<CancellationToken>()), Times.Once);

        _senderMock.Verify(s => s.SendTextMessageAsync(
            "593987654321",
            It.Is<string>(msg => msg.Contains("Live Location") || msg.Contains("tiempo real")),
            "phone_id_123",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleLocationAsync_WhenOutsideCoverage_SendsOutOfCoverageWarning()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = tenantId, Name = "La Granjita", Slug = "la-granjita", ContactPhone = "022999999" };
        db.Tenants.Add(tenant);

        // Sucursal en Guamaní (-0.33228, -78.55708) con radio pequeño de 2 km
        var branch = new Branch
        {
            Id = 1,
            TenantId = tenantId,
            Name = "Sucursal Guamaní",
            LocationPoint = GeometryFactory.CreatePoint(new Coordinate(-78.55708, -0.33228)),
            CoveragePolygon = GeometryFactory.CreatePolygon(new[]
            {
                new Coordinate(-78.56, -0.34),
                new Coordinate(-78.55, -0.34),
                new Coordinate(-78.55, -0.32),
                new Coordinate(-78.56, -0.32),
                new Coordinate(-78.56, -0.34)
            }),
            DeliveryRadiusKm = 2,
            IsActive = true
        };
        db.Branches.Add(branch);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            OrderNumber = 1003,
            CustomerName = "Cliente",
            CustomerPhone = "593987654321",
            Status = OrderStatus.Created,
            BranchId = 1,
            CreatedAt = DateTime.UtcNow
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant, SystemPrompt = "test" });

        var processor = new WhatsAppOrderLocationProcessor(
            db,
            _knowledgeMock.Object,
            _storeMock.Object,
            _trackingNotifierMock.Object,
            _kitchenNotifierMock.Object,
            _senderMock.Object,
            Options.Create(_options),
            _loggerMock.Object,
            _redisMock.Object);

        // Coordenadas en Carcelén (norte de Quito, a ~28 km de distancia)
        var location = new WhatsAppExtractedLocation(-0.0940, -78.4730, null, null, false);

        // Act
        var handled = await processor.HandleLocationAsync(new WhatsAppIncomingMessage { From = "593987654321" }, location, "phone_id_123", "Cliente");

        // Assert
        handled.Should().BeTrue();

        _senderMock.Verify(s => s.SendTextMessageAsync(
            "593987654321",
            It.Is<string>(msg => msg.Contains("fuera de nuestra zona de cobertura") && msg.Contains("Sucursal Guamaní")),
            "phone_id_123",
            It.IsAny<CancellationToken>()), Times.Once);

        _trackingNotifierMock.Verify(t => t.NotifyCustomerLocationUpdatedAsync(
            It.IsAny<Guid>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task HandleLocationAsync_WhenNoOrderExists_SavesCustomerDefaultLocationAndSharesMenu()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant { Id = tenantId, Name = "Brasas del Valle", Slug = "brasas-del-valle" };
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        _knowledgeMock.Setup(k => k.ResolveContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantChatContext { Tenant = tenant, SystemPrompt = "test" });

        var processor = new WhatsAppOrderLocationProcessor(
            db,
            _knowledgeMock.Object,
            _storeMock.Object,
            _trackingNotifierMock.Object,
            _kitchenNotifierMock.Object,
            _senderMock.Object,
            Options.Create(_options),
            _loggerMock.Object,
            _redisMock.Object);

        var location = new WhatsAppExtractedLocation(-0.1800, -78.4800, "Oficina", "Av. Amazonas y Eloy Alfaro", false);

        // Act
        var handled = await processor.HandleLocationAsync(
            new WhatsAppIncomingMessage { From = "593991234567" }, location, "phone_id_123", "Esteban");

        // Assert
        handled.Should().BeTrue();

        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Phone == "593991234567");
        customer.Should().NotBeNull();
        customer!.DefaultLocationPoint.Should().NotBeNull();
        customer.DefaultLocationPoint!.Y.Should().Be(-0.1800);
        customer.DefaultLocationPoint!.X.Should().Be(-78.4800);
        customer.DefaultAddressStreet.Should().Be("Av. Amazonas y Eloy Alfaro");

        _senderMock.Verify(s => s.SendTextMessageAsync(
            "593991234567",
            It.Is<string>(msg => msg.Contains("ha quedado guardada en nuestro sistema") && msg.Contains("brasas-del-valle/menu")),
            "phone_id_123",
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
