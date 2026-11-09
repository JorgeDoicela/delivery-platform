using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Auth.Register;

public class RegisterEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/register", async (
            RegisterRequest request,
            IValidator<RegisterCommand> validator,
            RegisterHandler handler,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var command = new RegisterCommand(
                Email: request.Email,
                Password: request.Password,
                FullName: request.FullName,
                Phone: request.Phone,
                TenantSlug: request.TenantSlug,
                IdentificationType: request.IdentificationType,
                IdentificationNumber: request.IdentificationNumber,
                IpAddress: ipAddress);

            var validationResult = await validator.ValidateAsync(command, cancellationToken);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.ToDictionary(e => e.PropertyName, e => new[] { e.ErrorMessage });
                return Results.ValidationProblem(errors);
            }

            var result = await handler.Handle(command, cancellationToken);

            if (result.IsSuccess)
            {
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = httpContext.Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddDays(7),
                    Path = "/"
                };

                httpContext.Response.Cookies.Append("refreshToken", result.Value.RefreshToken, cookieOptions);
            }

            return result.ToHttpResult();
        })
        .WithName("Register")
        .WithTags("Auth")
        .WithSummary("Registra una nueva cuenta de cliente y devuelve tokens de sesión.")
        .Produces<RegisterResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
