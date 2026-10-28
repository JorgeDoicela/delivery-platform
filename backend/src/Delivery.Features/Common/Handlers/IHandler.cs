namespace Delivery.Features.Common.Handlers;

/// <summary>
/// Contrato unificado para los manejadores de casos de uso en Vertical Slice Architecture.
/// Permite despacho desacoplado, registro fuertemente tipado en DI y extensibilidad de pipeline.
/// </summary>
/// <typeparam name="TRequest">Tipo del comando o consulta de entrada.</typeparam>
/// <typeparam name="TResponse">Tipo del resultado de salida.</typeparam>
public interface IHandler<in TRequest, TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken = default);
}

