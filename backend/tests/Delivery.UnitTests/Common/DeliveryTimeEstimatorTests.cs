using Delivery.Core.Common;
using Xunit;

namespace Delivery.UnitTests.Common;

public class DeliveryTimeEstimatorTests
{
    [Fact]
    public void Estimate_WhenSaturated_ReturnsPausado()
    {
        var result = DeliveryTimeEstimator.Estimate(distanceKm: 2.5, isHighDemand: false, isSaturated: true);
        Assert.Equal("Pausado (Saturación)", result);
    }

    [Theory]
    [InlineData(false, "15-20 min")]
    [InlineData(true, "25-35 min")]
    public void Estimate_WhenTakeout_ReturnsPreparationTimeRegardlessOfDistance(bool isHighDemand, string expected)
    {
        var result = DeliveryTimeEstimator.Estimate(distanceKm: 8.5, isHighDemand: isHighDemand, isSaturated: false, isTakeout: true);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(0, false, "35-45 min")]
    [InlineData(0, true, "60-75 min")]
    [InlineData(1.5, false, "30-40 min")]
    [InlineData(2.9, true, "50-65 min")]
    [InlineData(4.0, false, "35-45 min")]
    [InlineData(5.5, true, "60-75 min")]
    [InlineData(8.14, false, "50-60 min")]
    [InlineData(8.14, true, "70-85 min")]
    [InlineData(12.0, false, "65-80 min")]
    [InlineData(12.0, true, "85-100 min")]
    public void Estimate_WhenDelivery_CalculatesBasedOnDistanceAndDemand(double distanceKm, bool isHighDemand, string expected)
    {
        var result = DeliveryTimeEstimator.Estimate(distanceKm: distanceKm, isHighDemand: isHighDemand, isSaturated: false, isTakeout: false);
        Assert.Equal(expected, result);
    }
}
