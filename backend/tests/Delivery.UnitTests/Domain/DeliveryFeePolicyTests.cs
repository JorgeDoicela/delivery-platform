using Delivery.Core.Domain.Policies;
using FluentAssertions;
using Xunit;

namespace Delivery.UnitTests.Domain;

public class DeliveryFeePolicyTests
{
    [Fact]
    public void Calculate_ShouldReturnBaseFee_WhenDynamicFeeIsDisabled()
    {
        var result = DeliveryFeePolicy.Calculate(
            baseFee: 1.50m,
            enableDynamicDistanceFee: false,
            baseDistanceKm: 2.0,
            extraFeePerKm: 0.50m,
            maxDeliveryFee: 5.00m,
            freeDeliveryMinOrderAmount: null,
            straightLineDistanceKm: 6.0,
            orderSubtotal: 20.00m
        );

        result.DeliveryFee.Should().Be(1.50m);
        result.IsDynamicByDistance.Should().BeFalse();
        result.IsFreeByMinimumOrder.Should().BeFalse();
    }

    [Fact]
    public void Calculate_ShouldReturnBaseFee_WhenRoadDistanceIsWithinIncludedKm()
    {
        // 1.5 km línea recta * 1.25 = 1.88 km vial <= 2.0 km incluidos
        var result = DeliveryFeePolicy.Calculate(
            baseFee: 1.50m,
            enableDynamicDistanceFee: true,
            baseDistanceKm: 2.0,
            extraFeePerKm: 0.50m,
            maxDeliveryFee: 5.00m,
            freeDeliveryMinOrderAmount: null,
            straightLineDistanceKm: 1.5,
            orderSubtotal: 15.00m
        );

        result.EstimatedRoadDistanceKm.Should().Be(1.88);
        result.DeliveryFee.Should().Be(1.50m);
        result.IsDynamicByDistance.Should().BeTrue();
    }

    [Fact]
    public void Calculate_ShouldChargeExtraPerKmWithCommercialRounding_WhenDistanceExceedsIncludedKm()
    {
        // 4.0 km línea recta * 1.25 = 5.0 km vial -> 3.0 km extra * 0.50 = 1.50 -> 1.50 + 1.50 = 3.00
        var result = DeliveryFeePolicy.Calculate(
            baseFee: 1.50m,
            enableDynamicDistanceFee: true,
            baseDistanceKm: 2.0,
            extraFeePerKm: 0.50m,
            maxDeliveryFee: 6.00m,
            freeDeliveryMinOrderAmount: null,
            straightLineDistanceKm: 4.0,
            orderSubtotal: 18.00m
        );

        result.EstimatedRoadDistanceKm.Should().Be(5.0);
        result.DeliveryFee.Should().Be(3.00m);
        result.IsDynamicByDistance.Should().BeTrue();
    }

    [Fact]
    public void Calculate_ShouldCapFeeAtMaxDeliveryFee_WhenCalculatedExceedsCap()
    {
        // 10 km * 1.25 = 12.5 km -> 10.5 km extra * 0.60 = 6.30 + 1.50 = 7.80 -> tope 4.50
        var result = DeliveryFeePolicy.Calculate(
            baseFee: 1.50m,
            enableDynamicDistanceFee: true,
            baseDistanceKm: 2.0,
            extraFeePerKm: 0.60m,
            maxDeliveryFee: 4.50m,
            freeDeliveryMinOrderAmount: null,
            straightLineDistanceKm: 10.0,
            orderSubtotal: 25.00m
        );

        result.DeliveryFee.Should().Be(4.50m);
    }

    [Fact]
    public void Calculate_ShouldReturnZero_WhenOrderSubtotalMeetsFreeDeliveryMinimum()
    {
        var result = DeliveryFeePolicy.Calculate(
            baseFee: 1.50m,
            enableDynamicDistanceFee: true,
            baseDistanceKm: 2.0,
            extraFeePerKm: 0.50m,
            maxDeliveryFee: 5.00m,
            freeDeliveryMinOrderAmount: 30.00m,
            straightLineDistanceKm: 5.0,
            orderSubtotal: 30.00m
        );

        result.DeliveryFee.Should().Be(0.00m);
        result.IsFreeByMinimumOrder.Should().BeTrue();
    }

    [Fact]
    public void Calculate_ShouldRoundToNearestFiveCents_WhenExtraDistanceProducesFractionalCents()
    {
        // 2.5 km * 1.25 = 3.13 km vial -> 1.13 km extra * 0.45 = 0.5085 -> 1.50 + 0.5085 = 2.0085 -> 2.00
        // 2.7 km * 1.25 = 3.38 km vial -> 1.38 km extra * 0.45 = 0.621 -> 1.50 + 0.621 = 2.121 -> 2.10
        var result = DeliveryFeePolicy.Calculate(
            baseFee: 1.50m,
            enableDynamicDistanceFee: true,
            baseDistanceKm: 2.0,
            extraFeePerKm: 0.45m,
            maxDeliveryFee: null,
            freeDeliveryMinOrderAmount: null,
            straightLineDistanceKm: 2.7,
            orderSubtotal: 10.00m
        );

        result.DeliveryFee.Should().Be(2.10m);
    }
}
