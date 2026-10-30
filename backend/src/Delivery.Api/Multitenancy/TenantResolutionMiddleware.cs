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
        // Bypass para endpoints de sistema o listado global de directorio de tenants
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/hangfire", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // 1. Prioridad máxima: Header explícito X-Tenant-Slug enviado por el cliente / Storefront
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

        // 2. Detección por Claim en JWT de usuario autenticado (cuando no hay override explícito por Header)
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrWhiteSpace(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var claimTenantId))
            {
                var jwtTenant = await dbContext.Tenants
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == claimTenantId && t.IsActive);

                if (jwtTenant != null)
                {
                    tenantContext.SetTenant(jwtTenant.Id, jwtTenant.Slug);
                    await _next(context);
                    return;
                }
            }
        }

        string? tenantSlug = null;
        var host = context.Request.Host.Host.ToLowerInvariant();

        // 3. Detección por Dominio Personalizado (CustomDomain en TenantSettings)
        if (host != "localhost" && host != "127.0.0.1")
        {
            var customDomainTenant = await dbContext.TenantSettings
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Include(ts => ts.Tenant)
                .Where(ts => ts.CustomDomain != null && ts.CustomDomain.ToLower() == host && ts.Tenant.IsActive)
                .Select(ts => ts.Tenant)
                .FirstOrDefaultAsync();

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
