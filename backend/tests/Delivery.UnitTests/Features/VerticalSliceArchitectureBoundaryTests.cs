using System.Reflection;
using Delivery.Core.Common;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Handlers;
using FluentAssertions;
using Xunit;

namespace Delivery.UnitTests.Features;

/// <summary>
/// Pruebas de conformidad y arquitectura para garantizar que el backend cumpla estrictamente
/// con los principios de Vertical Slice Architecture (VSA):
/// 1. Aislamiento estricto entre slices (cero acoplamiento horizontal).
/// 2. Ausencia de capas intermedias horizontales (prohibición de Services, Managers y Repositories).
/// 3. Estandarización de contratos de Handlers (IHandler) y Endpoints (IEndpoint).
/// 4. Cohesión vertical completa dentro de cada directorio de caso de uso.
/// </summary>
public class VerticalSliceArchitectureBoundaryTests
{
    private static readonly Assembly FeaturesAssembly = typeof(IEndpoint).Assembly;

    [Fact]
    public void AllHandlers_MustImplementIHandlerInterface()
    {
        // Arrange
        var handlerTypes = FeaturesAssembly.GetTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface && t.Name.EndsWith("Handler", StringComparison.Ordinal))
            .ToList();

        handlerTypes.Should().NotBeEmpty();

        // Assert: Cada handler debe implementar IHandler<TRequest, TResponse>
        foreach (var handler in handlerTypes)
        {
            var implementsIHandler = handler.GetInterfaces()
                .Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IHandler<,>));

            implementsIHandler.Should().BeTrue(
                $"El manejador {handler.FullName} debe implementar el contrato IHandler<TRequest, TResponse>.");
        }
    }

    [Fact]
    public void AllEndpoints_MustImplementIEndpointInterface()
    {
        // Arrange
        var endpointTypes = FeaturesAssembly.GetTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface && t.Name.EndsWith("Endpoint", StringComparison.Ordinal))
            .ToList();

        endpointTypes.Should().NotBeEmpty();

        // Assert: Cada endpoint debe implementar IEndpoint
        foreach (var endpoint in endpointTypes)
        {
            typeof(IEndpoint).IsAssignableFrom(endpoint).Should().BeTrue(
                $"El endpoint {endpoint.FullName} debe implementar la interfaz IEndpoint.");
        }
    }

    [Fact]
    public void FeatureSlices_MustNotContainHorizontalServicesOrRepositories()
    {
        // Prohibición estricta de capas horizontales globales en VSA
        var forbiddenSuffixes = new[] { "Service", "Manager", "Repository", "Dao" };

        var violatingTypes = FeaturesAssembly.GetTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface)
            .Where(t => forbiddenSuffixes.Any(suffix => t.Name.EndsWith(suffix, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        violatingTypes.Should().BeEmpty(
            "En Vertical Slice Architecture queda prohibido reintroducir capas horizontales de servicios o repositorios.");
    }

    [Fact]
    public void FeatureSlices_MustNotHaveCrossSliceDependencies()
    {
        // Identificar los namespaces de vertical slices
        // Estructura: Delivery.Features.{Group}.{FeatureName}
        var sliceTypes = FeaturesAssembly.GetTypes()
            .Where(t => t.Namespace != null &&
                        t.Namespace.StartsWith("Delivery.Features.", StringComparison.Ordinal) &&
                        !t.Namespace.StartsWith("Delivery.Features.Common", StringComparison.Ordinal))
            .ToList();

        sliceTypes.Should().NotBeEmpty();

        // Agrupar tipos por vertical slice (namespace exacto)
        var sliceGroups = sliceTypes.GroupBy(t => t.Namespace!).ToList();

        foreach (var group in sliceGroups)
        {
            var currentSliceNamespace = group.Key;
            var otherSliceNamespaces = sliceGroups
                .Where(g => g.Key != currentSliceNamespace)
                .Select(g => g.Key)
                .ToList();

            foreach (var type in group)
            {
                // Inspeccionar campos
                var fieldTypes = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static)
                    .Select(f => f.FieldType);

                // Inspeccionar propiedades
                var propertyTypes = type.GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static)
                    .Select(p => p.PropertyType);

                // Inspeccionar métodos
                var methodTypes = type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
                    .SelectMany(m => m.GetParameters().Select(p => p.ParameterType).Concat(new[] { m.ReturnType }));

                // Inspeccionar constructores
                var constructorTypes = type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                    .SelectMany(c => c.GetParameters().Select(p => p.ParameterType));

                var allReferencedTypes = fieldTypes
                    .Concat(propertyTypes)
                    .Concat(methodTypes)
                    .Concat(constructorTypes)
                    .Select(ExtractUnderlyingType)
                    .Where(t => t != null && t.Namespace != null)
                    .Distinct();

                foreach (var refType in allReferencedTypes)
                {
                    var isFromOtherSlice = otherSliceNamespaces.Any(otherNs =>
                        refType!.Namespace == otherNs || refType.Namespace!.StartsWith(otherNs + ".", StringComparison.Ordinal));

                    isFromOtherSlice.Should().BeFalse(
                        $"El tipo {type.FullName} en el slice '{currentSliceNamespace}' no debe depender de {refType!.FullName} perteneciente al slice '{refType.Namespace}'.");
                }
            }
        }
    }

    [Theory]
    [InlineData("Delivery.Features.Branches.GetBranchCapacity")]
    [InlineData("Delivery.Features.Branches.ResolveBranch")]
    [InlineData("Delivery.Features.Catalog.GetActiveMenu")]
    [InlineData("Delivery.Features.Catalog.ToggleProductStatus")]
    [InlineData("Delivery.Features.Kitchen.GetActiveKitchenOrders")]
    [InlineData("Delivery.Features.Orders.ApproveTransferOrder")]
    [InlineData("Delivery.Features.Orders.CreateOrder")]
    [InlineData("Delivery.Features.Orders.GetOrderById")]
    [InlineData("Delivery.Features.Orders.UpdateOrderStatus")]
    [InlineData("Delivery.Features.Tracking.GetDriverLocation")]
    [InlineData("Delivery.Features.Tracking.IngestDriverLocation")]
    public void EachFeatureSlice_MustContainEndpointAndHandler(string sliceNamespace)
    {
        var sliceTypes = FeaturesAssembly.GetTypes()
            .Where(t => t.Namespace == sliceNamespace)
            .ToList();

        sliceTypes.Should().NotBeEmpty($"El slice '{sliceNamespace}' debe contener tipos definidos.");

        var hasEndpoint = sliceTypes.Any(t => typeof(IEndpoint).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract);
        var hasHandler = sliceTypes.Any(t => t.Name.EndsWith("Handler", StringComparison.Ordinal) && !t.IsInterface && !t.IsAbstract);

        hasEndpoint.Should().BeTrue($"El slice '{sliceNamespace}' debe contener una implementación de IEndpoint.");
        hasHandler.Should().BeTrue($"El slice '{sliceNamespace}' debe contener un Handler.");
    }

    private static Type ExtractUnderlyingType(Type type)
    {
        if (type.IsGenericType)
        {
            var genArgs = type.GetGenericArguments();
            if (genArgs.Length == 1)
            {
                return ExtractUnderlyingType(genArgs[0]);
            }
        }

        if (type.IsArray)
        {
            return ExtractUnderlyingType(type.GetElementType()!);
        }

        return type;
    }
}

