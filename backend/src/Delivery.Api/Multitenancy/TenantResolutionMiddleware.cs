using Delivery.Core.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Delivery.Api.Multitenancy;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext, AppDbContext dbContext)
    {
        // 0. Deteccion prioritaria por Claim en JWT de usuario autenticado
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

        // 1. Detección por Header explícito
        if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var headerSlug) && !string.IsNullOrWhiteSpace(headerSlug))
        {
            tenantSlug = headerSlug.ToString().Trim().ToLowerInvariant();
        }

        // 2. Detección por Subdominio si no viene por header
        if (string.IsNullOrWhiteSpace(tenantSlug))
        {
            var host = context.Request.Host.Host;
            var parts = host.Split('.');
            if (parts.Length > 2 && parts[0] != "www" && parts[0] != "api")
            {
                tenantSlug = parts[0].ToLowerInvariant();
            }
        }

        // 3. Fallback en desarrollo o petición sin subdominio: resolver tenant predeterminado "la-granjita"
        if (string.IsNullOrWhiteSpace(tenantSlug))
        {
            tenantSlug = "la-granjita";
        }

        // Buscar Tenant en Base de Datos (omitir filtros para resolver el tenant)
        var tenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && t.IsActive);

        if (tenant != null)
        {
            tenantContext.SetTenant(tenant.Id, tenant.Slug);
        }

        await _next(context);
    }
}

