using Delivery.Core.Domain.Entities;
using Delivery.Core.Domain.Enums;
using FluentAssertions;
using NetTopologySuite.Geometries;
using Xunit;

namespace Delivery.UnitTests.Domain;

public class OrderEntityTests
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    [Fact]
    public void Order_WhenInstantiated_ShouldHaveValidDefaultValues()
    {
        // Act
        var order = new Order();

        // Assert
        order.Id.Should().NotBeEmpty();
        order.Status.Should().Be(OrderStatus.Created);
        order.PaymentMethod.Should().Be(PaymentMethod.CashOnDelivery);
        order.DeliveryType.Should().Be(DeliveryType.Delivery);
        order.IdentificationType.Should().Be("CONSUMIDOR_FINAL");
        order.IdentificationNumber.Should().Be("9999999999999");
        order.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        order.Items.Should().BeEmpty();
    }

    [Fact]
    public void Order_WithDeliveryLocation_ShouldStoreCoordinatesCorrectly()
    {
        // Arrange
        var deliveryPoint = GeometryFactory.CreatePoint(new Coordinate(-78.4845, -0.1782));
        var order = new Order
        {
            CustomerName = "Carlos Mendoza",
            CustomerPhone = "0991234567",
            AddressStreet = "Av. Amazonas y Naciones Unidas",
            DeliveryLocation = deliveryPoint,
            Subtotal = 25.50m,
            DeliveryFee = 2.00m,
            Total = 27.50m
        };

        // Assert
        order.DeliveryLocation.Should().NotBeNull();
        order.DeliveryLocation!.X.Should().Be(-78.4845);
        order.DeliveryLocation.Y.Should().Be(-0.1782);
        order.Total.Should().Be(27.50m);
    }

    [Fact]
    public void Order_WithItemsAndModifiers_ShouldMaintainRelationships()
    {
        // Arrange
        var order = new Order();
        var item = new OrderItem
        {
            OrderId = order.Id,
            ProductId = 1,
            ProductNameSnapshot = "Pollo Entero Asado",
            Quantity = 2,
            UnitPriceSnapshot = 12.00m
        };

        var modifier = new OrderItemModifier
        {
            OrderItemId = item.Id,
            ModifierOptionId = 10,
            PriceSnapshot = 1.50m
        };

        item.Modifiers.Add(modifier);
        order.Items.Add(item);

        // Assert
        order.Items.Should().HaveCount(1);
        order.Items.First().Modifiers.Should().HaveCount(1);
        order.Items.First().Modifiers.First().PriceSnapshot.Should().Be(1.50m);
    }
}
