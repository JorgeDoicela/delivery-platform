using Delivery.Core.Domain.Common;
using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using Delivery.Core.Infrastructure.Persistence;
using Delivery.Features.Catalog.GetPopularProducts;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using Xunit;
using Order = Delivery.Core.Domain.Entities.Order;

namespace Delivery.UnitTests.Features;

public class GetPopularProductsHandlerTests
{
    private static readonly Guid TenantA = Guid.NewGuid();

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenNoOrdersExist_ShouldReturnFallbackActiveProductsOrderedByPriority()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var category1 = new Category { Id = 1, Name = "Combos", DisplayOrder = 1, TenantId = TenantA };
        var category2 = new Category { Id = 2, Name = "Bebidas", DisplayOrder = 2, TenantId = TenantA };
        context.Categories.AddRange(category1, category2);

        var product1 = new Product { Id = 1, Name = "Combo 1", BasePrice = 15.0m, Category = "Combos", CategoryId = 1, CategoryEntity = category1, IsActive = true, TenantId = TenantA };
        var product2 = new Product { Id = 2, Name = "Combo 2", BasePrice = 20.0m, Category = "Combos", CategoryId = 1, CategoryEntity = category1, IsActive = true, TenantId = TenantA };
        var product3 = new Product { Id = 3, Name = "Cola 2L", BasePrice = 2.5m, Category = "Bebidas", CategoryId = 2, CategoryEntity = category2, IsActive = true, TenantId = TenantA };
        context.Products.AddRange(product1, product2, product3);
        await context.SaveChangesAsync();

        var mockTenantContext = new Mock<ITenantContext>();
        mockTenantContext.Setup(t => t.TenantId).Returns(TenantA);

        var mockRedis = new Mock<IConnectionMultiplexer>();
        var mockDb = new Mock<IDatabase>();
        mockDb.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>())).ReturnsAsync(RedisValue.Null);
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(mockDb.Object);

        var mockLogger = new Mock<ILogger<GetPopularProductsHandler>>();

        var handler = new GetPopularProductsHandler(context, mockTenantContext.Object, mockRedis.Object, mockLogger.Object);

        // Act
        var result = await handler.Handle(new GetPopularProductsQuery(Limit: 3, Days: 30));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(3);
        // Combos tienen DisplayOrder = 1, product2 tiene mayor precio ($20) que product1 ($15)
        result.Value[0].Id.Should().Be(2);
        result.Value[1].Id.Should().Be(1);
        result.Value[2].Id.Should().Be(3);
    }

    [Fact]
    public async Task Handle_WhenRealSalesExist_ShouldRankByQuantitySoldDescending()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var category = new Category { Id = 1, Name = "Combos", DisplayOrder = 1, TenantId = TenantA };
        context.Categories.Add(category);

        var productA = new Product { Id = 10, Name = "Pollo 1/4", BasePrice = 4.5m, Category = "Combos", CategoryId = 1, CategoryEntity = category, IsActive = true, TenantId = TenantA };
        var productB = new Product { Id = 20, Name = "Pollo Entero", BasePrice = 14.0m, Category = "Combos", CategoryId = 1, CategoryEntity = category, IsActive = true, TenantId = TenantA };
        var productC = new Product { Id = 30, Name = "Combo Familiar", BasePrice = 22.0m, Category = "Combos", CategoryId = 1, CategoryEntity = category, IsActive = true, TenantId = TenantA };
        context.Products.AddRange(productA, productB, productC);

        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = TenantA,
            Status = OrderStatus.Delivered,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            Items = new List<OrderItem>
            {
                new() { ProductId = 10, Quantity = 5, Product = productA },
                new() { ProductId = 20, Quantity = 25, Product = productB }, // 25 unidades
                new() { ProductId = 30, Quantity = 10, Product = productC }, // 10 unidades
            }
        };

        var order2 = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = TenantA,
            Status = OrderStatus.Delivered,
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            Items = new List<OrderItem>
            {
                new() { ProductId = 30, Quantity = 20, Product = productC }, // 10 + 20 = 30 unidades totales
            }
        };

        context.Orders.AddRange(order1, order2);
        await context.SaveChangesAsync();

        var mockTenantContext = new Mock<ITenantContext>();
        mockTenantContext.Setup(t => t.TenantId).Returns(TenantA);

        var mockRedis = new Mock<IConnectionMultiplexer>();
        var mockDb = new Mock<IDatabase>();
        mockDb.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>())).ReturnsAsync(RedisValue.Null);
        mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(mockDb.Object);

        var mockLogger = new Mock<ILogger<GetPopularProductsHandler>>();

        var handler = new GetPopularProductsHandler(context, mockTenantContext.Object, mockRedis.Object, mockLogger.Object);

        // Act
        var result = await handler.Handle(new GetPopularProductsQuery(Limit: 3, Days: 30));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(3);
        // Ranking real: Product 30 (30 vendidas) > Product 20 (25 vendidas) > Product 10 (5 vendidas)
        result.Value[0].Id.Should().Be(30);
        result.Value[0].TotalSold.Should().Be(30);

        result.Value[1].Id.Should().Be(20);
        result.Value[1].TotalSold.Should().Be(25);

        result.Value[2].Id.Should().Be(10);
        result.Value[2].TotalSold.Should().Be(5);
    }
}
