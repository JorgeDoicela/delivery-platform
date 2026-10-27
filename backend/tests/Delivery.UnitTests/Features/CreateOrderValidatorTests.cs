using Delivery.Core.Domain.Enums;
using Delivery.Features.Orders.CreateOrder;
using FluentAssertions;
using Xunit;

namespace Delivery.UnitTests.Features;

public class CreateOrderValidatorTests
{
    private readonly CreateOrderValidator _validator = new();

    private static CreateOrderCommand CreateValidCommand() => new(
        BranchId: 1,
        CustomerName: "Juan Pérez",
        CustomerPhone: "0998765432",
        CustomerEmail: "juan@example.com",
        IdentificationType: "CEDULA",
        IdentificationNumber: "1712345678",
        AddressStreet: "Av. 10 de Agosto y Colón",
        AddressReference: "Frente al parque",
        DeliveryLatitude: -0.1800,
        DeliveryLongitude: -78.4800,
        PaymentMethod: PaymentMethod.CashOnDelivery,
        DeliveryType: DeliveryType.Delivery,
        CashAmountPaid: 30.00m,
        TransferReceiptUrl: null,
        Items:
        [
            new CreateOrderItemRequest(ProductId: 1, Quantity: 2, SelectedModifierOptionIds: [1, 2])
        ]
    );

    [Fact]
    public void Validate_WithValidCommand_ShouldHaveNoValidationErrors()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_WithInvalidBranchId_ShouldFail(int invalidBranchId)
    {
        // Arrange
        var command = CreateValidCommand() with { BranchId = invalidBranchId };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateOrderCommand.BranchId));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_WithEmptyCustomerName_ShouldFail(string emptyName)
    {
        // Arrange
        var command = CreateValidCommand() with { CustomerName = emptyName };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateOrderCommand.CustomerName));
    }

    [Fact]
    public void Validate_WithEmptyItems_ShouldFail()
    {
        // Arrange
        var command = CreateValidCommand() with { Items = [] };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateOrderCommand.Items));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(51)]
    public void Validate_WithInvalidItemQuantity_ShouldFail(int invalidQuantity)
    {
        // Arrange
        var command = CreateValidCommand() with
        {
            Items = [new CreateOrderItemRequest(ProductId: 1, Quantity: invalidQuantity, null)]
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.StartsWith("Items[0].Quantity"));
    }
}
