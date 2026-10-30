using Delivery.Core.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Api.Multitenancy;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;

    public TenantResolutionMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext, AppDbContext dbContext)
    {
        // Bypass para endpoints de sistema, autenticación o gobernanza global de plataforma
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/hangfire", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/v1/auth", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/tenants", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/tenants/platform", StringComparison.OrdinalIgnoreCase) ||
            (path.StartsWith("/api/tenants/", StringComparison.OrdinalIgnoreCase) &&
             path.EndsWith("/status", StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var isAuthenticated = context.User.Identity?.IsAuthenticated == true;
        var isSuperAdmin = isAuthenticated && context.User.IsInRole("SuperAdmin");

        // 1. Aislamiento estricto por JWT para operadores de franquicia (no SuperAdmin):
        // Imposibilita que un TenantAdmin o operador autenticado falsifique el header X-Tenant-Slug de otra marca.
        if (isAuthenticated && !isSuperAdmin)
        {
            var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrWhiteSpace(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var claimTenantId))
            {
                var jwtTenant = await dbContext.Tenants
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == claimTenantId && t.IsActive);

                if (jwtTenant == null)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/problem+json";
                    var problem = new ProblemDetails
                    {
                        Status = StatusCodes.Status403Forbidden,
                        Title = "Comercio suspendido o no autorizado",
                        Detail = "El comercio asociado a tu cuenta operativa no se encuentra activo.",
                        Type = "https://tools.ietf.org/html/rfc7807"
                    };
                    await context.Response.WriteAsJsonAsync(problem);
                    return;
                }

                tenantContext.SetTenant(jwtTenant.Id, jwtTenant.Slug);
                await _next(context);
                return;
            }
        }

        // 2. Header explícito X-Tenant-Slug (permitido para SuperAdmin y navegación de Storefront público)
        if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var headerSlugValues))
        {
            var explicitSlug = headerSlugValues.ToString().Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(explicitSlug))
            {
                var explicitTenant = await dbContext.Tenants
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Slug == explicitSlug && t.IsActive);

                if (explicitTenant == null)
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    context.Response.ContentType = "application/problem+json";
                    var problem = new ProblemDetails
                    {
                        Status = StatusCodes.Status404NotFound,
                        Title = "Negocio no encontrado",
                        Detail = $"No existe un negocio activo registrado bajo el identificador '{explicitSlug}'.",
                        Type = "https://tools.ietf.org/html/rfc7807"
                    };
                    await context.Response.WriteAsJsonAsync(problem);
                    return;
                }

                tenantContext.SetTenant(explicitTenant.Id, explicitTenant.Slug);
                await _next(context);
                return;
            }
        }

        string? tenantSlug = null;
        var host = context.Request.Host.Host.ToLowerInvariant();

        // 3. Detección por Dominio Personalizado (CustomDomain en TenantSettings)
        if (host != "localhost" && host != "127.0.0.1")
        {
#pragma warning disable CA1862, CA1304, CA1311
            var customDomainTenant = await dbContext.TenantSettings
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Include(ts => ts.Tenant)
                .Where(ts => ts.CustomDomain != null && ts.CustomDomain.ToLower() == host && ts.Tenant.IsActive)
                .Select(ts => ts.Tenant)
                .FirstOrDefaultAsync();
#pragma warning restore CA1862, CA1304, CA1311

            if (customDomainTenant != null)
            {
                tenantContext.SetTenant(customDomainTenant.Id, customDomainTenant.Slug);
                await _next(context);
                return;
            }

            // 4. Detección por Subdominio ({slug}.dominio.com)
            var parts = host.Split('.');
            if (parts.Length > 2 && parts[0] != "www" && parts[0] != "api")
            {
                tenantSlug = parts[0];
            }
        }

        // 5. Fallback al tenant predeterminado configurado
        if (string.IsNullOrWhiteSpace(tenantSlug))
        {
            tenantSlug = _configuration["Multitenancy:DefaultTenantSlug"] ?? "la-granjita";
        }

        var defaultTenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && t.IsActive)
            ?? await dbContext.Tenants
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(t => t.IsActive)
                .OrderBy(t => t.Id)
                .FirstOrDefaultAsync();

        if (defaultTenant != null)
        {
            tenantContext.SetTenant(defaultTenant.Id, defaultTenant.Slug);
        }

        await _next(context);
    }
}
