using Delivery.Core.Domain.Enums;
using Delivery.Features.Branches.GetBranchCapacity;
using Delivery.Features.Branches.ResolveBranch;
using Delivery.Features.Kitchen.GetActiveKitchenOrders;
using Delivery.Features.Orders.ApproveTransferOrder;
using Delivery.Features.Orders.GetOrderById;
using Delivery.Features.Orders.UpdateOrderStatus;
using Delivery.Features.Tenants.CreateTenant;
using Delivery.Features.Tracking.GetDriverLocation;
using Delivery.Features.Tracking.IngestDriverLocation;
using FluentAssertions;
using Xunit;

namespace Delivery.UnitTests.Features;

public class FeatureValidatorsTests
{
    [Theory]
    [InlineData(0, 0, true)]
    [InlineData(-0.18, -78.48, true)]
    [InlineData(90.1, 0, false)]
    [InlineData(-90.1, 0, false)]
    [InlineData(0, 180.1, false)]
    [InlineData(0, -180.1, false)]
    public void ResolveBranchValidator_ValidatesLatitudeAndLongitudeRanges(double lat, double lon, bool expectedValid)
    {
        var validator = new ResolveBranchValidator();
        var result = validator.Validate(new ResolveBranchQuery(lat, lon));
        result.IsValid.Should().Be(expectedValid);
    }

    [Theory]
    [InlineData("driver-1", 0.0, 0.0, 0.0, true)]
    [InlineData("", 0.0, 0.0, 0.0, false)]
    [InlineData("driver-1", 95.0, 0.0, 0.0, false)]
    [InlineData("driver-1", 0.0, 185.0, 0.0, false)]
    [InlineData("driver-1", 0.0, 0.0, 365.0, false)]
    [InlineData("driver-1", 0.0, 0.0, -5.0, false)]
    public void IngestDriverLocationValidator_ValidatesTelemetryRanges(string driverId, double lat, double lon, double heading, bool expectedValid)
    {
        var validator = new IngestDriverLocationValidator();
        var command = new IngestDriverLocationCommand(
            DriverId: driverId,
            OrderId: expectedValid ? Guid.NewGuid() : Guid.Empty,
            Latitude: lat,
            Longitude: lon,
            Heading: heading
        );

        var result = validator.Validate(command);
        result.IsValid.Should().Be(expectedValid);
    }

    [Fact]
    public void GetDriverLocationValidator_FailsWhenOrderIdEmpty()
    {
        var validator = new GetDriverLocationValidator();
        var result = validator.Validate(new GetDriverLocationQuery(Guid.Empty));
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void UpdateOrderStatusValidator_FailsWhenOrderIdEmptyOrEnumInvalid()
    {
        var validator = new UpdateOrderStatusValidator();
        var resultEmptyGuid = validator.Validate(new UpdateOrderStatusCommand(Guid.Empty, OrderStatus.Confirmed));
        resultEmptyGuid.IsValid.Should().BeFalse();

        var resultInvalidEnum = validator.Validate(new UpdateOrderStatusCommand(Guid.NewGuid(), (OrderStatus)999));
        resultInvalidEnum.IsValid.Should().BeFalse();
    }

    [Fact]
    public void ApproveTransferValidator_FailsWhenOrderIdEmpty()
    {
        var validator = new ApproveTransferValidator();
        var result = validator.Validate(new ApproveTransferCommand(Guid.Empty, true));
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void GetOrderByIdValidator_FailsWhenOrderIdEmpty()
    {
        var validator = new GetOrderByIdValidator();
        var result = validator.Validate(new GetOrderByIdQuery(Guid.Empty));
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(1, true)]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    public void GetBranchCapacityValidator_ValidatesBranchId(int branchId, bool expectedValid)
    {
        var validator = new GetBranchCapacityValidator();
        var result = validator.Validate(new GetBranchCapacityQuery(branchId));
        result.IsValid.Should().Be(expectedValid);
    }

    [Theory]
    [InlineData("login", false)]
    [InlineData("cocina", false)]
    [InlineData("checkout", false)]
    [InlineData("admin", false)]
    [InlineData("api", false)]
    [InlineData("pollos-hermanos", true)]
    [InlineData("asadero-don-pedro", true)]
    public void CreateTenantValidator_ValidatesReservedSlugs(string slug, bool expectedValid)
    {
        var validator = new CreateTenantValidator();
        var command = new CreateTenantCommand(
            Name: "Comercio Test",
            Slug: slug,
            BusinessName: "Comercio Test S.A.",
            TaxId: "1790011223001",
            Tagline: "Sabor tradicional",
            Description: "Restaurante de comida tradicional.",
            BrandPrimaryColor: "#E4002B",
            BrandPrimaryHoverColor: "#C00024",
            BrandAccentColor: "#FFC72C",
            BaseDeliveryFee: 2.50m,
            ContactPhone: "+593991234567",
            ContactEmail: "info@comercio.com",
            PrimaryBranchName: "Matriz Centro",
            PrimaryBranchAddress: "Av. 10 de Agosto",
            AdminFullName: "Juan Admin",
            AdminEmail: "admin@comercio.com",
            AdminPassword: "Password123"
        );

        var result = validator.Validate(command);
        result.IsValid.Should().Be(expectedValid);
        if (!expectedValid)
        {
            result.Errors.Should().Contain(e => e.PropertyName == "Slug");
        }
    }
}
