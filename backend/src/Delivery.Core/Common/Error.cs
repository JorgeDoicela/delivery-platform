namespace Delivery.Core.Common;

#pragma warning disable CA1716 // Identificadores no deben coincidir con palabras clave de otros lenguajes
public sealed record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NullValue = new("Error.NullValue", "El valor proporcionado es nulo.");
}
#pragma warning restore CA1716
