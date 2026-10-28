using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Common.Endpoints;

/// <summary>
/// Contrato unificado para que cada Vertical Slice exponga su propio endpoint HTTP.
/// </summary>
public interface IEndpoint
{
    void MapEndpoint(IEndpointRouteBuilder app);
}

