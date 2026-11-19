using System.Security.Claims;
using Delivery.Features.Common.Endpoints;
using Delivery.Features.Common.Http;
using Fido2NetLib;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Delivery.Features.Auth.WebAuthn;

public class WebAuthnEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth/webauthn")
            .WithTags("WebAuthn");

        // 1. Opciones de Registro (Requiere Autenticación)
        group.MapPost("/register/options", async (
            WebAuthnRegisterOptionsRequest? request,
            RegisterOptionsHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null) return Results.Unauthorized();

            var origin = GetOrigin(httpContext);
            var tenantSlug = request?.TenantSlug ?? httpContext.Request.Headers["X-Tenant-Slug"].FirstOrDefault();

            var command = new RegisterOptionsCommand(userId.Value, tenantSlug, origin);
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("WebAuthnRegisterOptions")
        .Produces<CredentialCreateOptions>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 2. Completar Registro (Requiere Autenticación)
        group.MapPost("/register/complete", async (
            WebAuthnRegisterCompleteRequest request,
            RegisterCompleteHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null) return Results.Unauthorized();

            var origin = GetOrigin(httpContext);
            var tenantSlug = request.TenantSlug ?? httpContext.Request.Headers["X-Tenant-Slug"].FirstOrDefault();

            var command = new RegisterCompleteCommand(
                userId.Value,
                request.Attestation,
                request.FriendlyName,
                tenantSlug,
                origin);

            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("WebAuthnRegisterComplete")
        .Produces<WebAuthnCredentialDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 3. Opciones de Login (Público)
        group.MapPost("/login/options", async (
            WebAuthnLoginOptionsRequest? request,
            LoginOptionsHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var origin = GetOrigin(httpContext);
            var tenantSlug = request?.TenantSlug ?? httpContext.Request.Headers["X-Tenant-Slug"].FirstOrDefault();

            var command = new LoginOptionsCommand(request?.Email, tenantSlug, origin);
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .AllowAnonymous()
        .WithName("WebAuthnLoginOptions")
        .Produces<WebAuthnLoginOptionsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);

        // 4. Completar Login (Público)
        group.MapPost("/login/complete", async (
            WebAuthnLoginCompleteRequest request,
            LoginCompleteHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var origin = GetOrigin(httpContext);
            var tenantSlug = request.TenantSlug ?? httpContext.Request.Headers["X-Tenant-Slug"].FirstOrDefault();
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();

            var command = new LoginCompleteCommand(
                request.SessionId,
                request.Assertion,
                tenantSlug,
                origin,
                ipAddress);

            var result = await handler.Handle(command, ct);

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
        .AllowAnonymous()
        .WithName("WebAuthnLoginComplete")
        .Produces<WebAuthnLoginResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);

        // 5. Listar Credenciales del Usuario
        group.MapGet("/credentials", async (
            GetCredentialsHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null) return Results.Unauthorized();

            var query = new GetCredentialsQuery(userId.Value);
            var result = await handler.Handle(query, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("WebAuthnGetCredentials")
        .Produces<List<WebAuthnCredentialDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 6. Eliminar Credencial
        group.MapDelete("/credentials/{id:guid}", async (
            Guid id,
            DeleteCredentialHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null) return Results.Unauthorized();

            var command = new DeleteCredentialCommand(id, userId.Value);
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("WebAuthnDeleteCredential")
        .Produces(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 7. Renombrar Credencial
        group.MapPatch("/credentials/{id:guid}", async (
            Guid id,
            UpdateWebAuthnCredentialRequest request,
            UpdateCredentialHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null) return Results.Unauthorized();

            var command = new UpdateCredentialCommand(id, userId.Value, request.FriendlyName);
            var result = await handler.Handle(command, ct);
            return result.ToHttpResult();
        })
        .RequireAuthorization()
        .WithName("WebAuthnUpdateCredential")
        .Produces<WebAuthnCredentialDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    private static Guid? GetUserId(HttpContext context)
    {
        var claim = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue("sub");

        if (!string.IsNullOrWhiteSpace(claim) && Guid.TryParse(claim, out var id))
        {
            return id;
        }

        return null;
    }

    private static string? GetOrigin(HttpContext context)
    {
        var origin = context.Request.Headers.Origin.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(origin)) return origin;

        var referer = context.Request.Headers.Referer.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(referer)) return referer;

        return null;
    }
}
