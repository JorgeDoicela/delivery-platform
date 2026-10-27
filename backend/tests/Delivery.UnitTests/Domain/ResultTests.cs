using Delivery.Core.Common;
using FluentAssertions;
using Xunit;

namespace Delivery.UnitTests.Domain;

public class ResultTests
{
    [Fact]
    public void Success_ShouldCreateSuccessfulResult_WithoutError()
    {
        // Act
        var result = Result.Success();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Error.Should().Be(Error.None);
    }

    [Fact]
    public void Failure_ShouldCreateFailedResult_WithSpecificError()
    {
        // Arrange
        var customError = new Error("Test.Error", "Error de prueba para validación");

        // Act
        var result = Result.Failure(customError);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(customError);
    }

    [Fact]
    public void GenericSuccess_ShouldContainValue_AndBeSuccessful()
    {
        // Act
        var result = Result.Success(42);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(42);
        result.Error.Should().Be(Error.None);
    }

    [Fact]
    public void GenericFailure_AccessingValue_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var error = new Error("Domain.NotFound", "Entidad no encontrada");
        var result = Result.Failure<string>(error);

        // Act
        var act = () => _ = result.Value;

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("No se puede acceder al valor de un resultado fallido.");
    }

    [Fact]
    public void ImplicitOperator_WithNonNullValue_ShouldCreateSuccessfulResult()
    {
        // Act
        Result<string> result = "Operación completada";

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("Operación completada");
    }

    [Fact]
    public void ImplicitOperator_WithNullValue_ShouldCreateFailureResult()
    {
        // Arrange
        string? nullString = null;

        // Act
        Result<string> result = nullString;

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(Error.NullValue);
    }
}
