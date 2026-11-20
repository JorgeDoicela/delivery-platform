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
        // Bypass para endpoints de sistema, telemetría o gobernanza global de plataforma
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/hangfire", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/hubs", StringComparison.OrdinalIgnoreCase) ||
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

        var method = context.Request.Method;
        var includeInactive = string.Equals(
            context.Request.Query["includeInactive"],
            "true",
            StringComparison.OrdinalIgnoreCase);

        var isPublicStorefrontRequest =
            (HttpMethods.IsGet(method) && (
                path.Equals("/api/tenants/current", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/api/branches", StringComparison.OrdinalIgnoreCase) ||
                (path.Equals("/api/catalog/menu", StringComparison.OrdinalIgnoreCase) && !includeInactive) ||
                path.Equals("/api/catalog/popular", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/api/catalog/bestsellers", StringComparison.OrdinalIgnoreCase) ||
                (path.StartsWith("/api/orders/", StringComparison.OrdinalIgnoreCase) &&
                 !path.EndsWith("/history", StringComparison.OrdinalIgnoreCase)))) ||
            (HttpMethods.IsPost(method) && (
                path.Equals("/api/geofencing/resolve", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/api/orders", StringComparison.OrdinalIgnoreCase)));

        // 1. Aislamiento estricto por JWT para operadores de franquicia (no SuperAdmin ni clientes comensales) en endpoints operativos:
        // Imposibilita que un TenantAdmin u operador falsifique el header X-Tenant-Slug de otra marca en paneles internos.
        var isFranchiseStaff = isAuthenticated && !isSuperAdmin && (
            context.User.IsInRole("TenantAdmin") ||
            context.User.IsInRole("BranchManager") ||
            context.User.IsInRole("Cashier") ||
            context.User.IsInRole("KitchenStaff") ||
            context.User.IsInRole("Driver"));

        if (isFranchiseStaff && !isPublicStorefrontRequest)
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

        string? domainHeader = null;
        if (context.Request.Headers.TryGetValue("X-Tenant-Domain", out var domainValues))
        {
            var raw = domainValues.ToString().Trim().ToLowerInvariant();
            domainHeader = raw.Contains(':') ? raw.Split(':')[0] : raw;
        }
        else if (context.Request.Headers.TryGetValue("X-Forwarded-Host", out var fwdValues))
        {
            var raw = fwdValues.ToString().Trim().ToLowerInvariant().Split(',')[0].Trim();
            domainHeader = raw.Contains(':') ? raw.Split(':')[0] : raw;
        }

        var host = (!string.IsNullOrWhiteSpace(domainHeader) ? domainHeader : context.Request.Host.Host).ToLowerInvariant();
        if (host.Contains(':'))
        {
            host = host.Split(':')[0];
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

                if (explicitTenant != null)
                {
                    tenantContext.SetTenant(explicitTenant.Id, explicitTenant.Slug);
                    await _next(context);
                    return;
                }

                // Si el slug explícito no existe pero la petición proviene de un dominio personalizado registrado,
                // no abortar inmediatamente con 404; permitir que continúe a la resolución por host.
                var hasCustomDomainMatch = await dbContext.TenantSettings
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .AnyAsync(ts => ts.CustomDomain != null && EF.Functions.ILike(ts.CustomDomain, host) && ts.Tenant.IsActive);

                if (!hasCustomDomainMatch)
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
            }
        }

        // 3. Detección por Dominio Personalizado (CustomDomain en TenantSettings)
        if (host != "localhost" && host != "127.0.0.1" && host != "::1")
        {
            var customDomainTenant = await dbContext.TenantSettings
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Include(ts => ts.Tenant)
                .Where(ts => ts.CustomDomain != null && EF.Functions.ILike(ts.CustomDomain, host) && ts.Tenant.IsActive)
                .Select(ts => ts.Tenant)
                .FirstOrDefaultAsync();

            if (customDomainTenant != null)
            {
                tenantContext.SetTenant(customDomainTenant.Id, customDomainTenant.Slug);
                await _next(context);
                return;
            }
        }

        // 4. Detección por Subdominio ({slug}.mesafy.com / {slug}.mesafy.doicela.dev)
        var parts = host.Split('.');
        var reservedSubdomains = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "www", "api", "mesafy", "platform", "app", "admin", "mail", "cdn", "assets", "static"
        };

        var platformDomain = Environment.GetEnvironmentVariable("NEXT_PUBLIC_PLATFORM_DOMAIN")
            ?? Environment.GetEnvironmentVariable("PLATFORM_DOMAIN")
            ?? "mesafy.doicela.dev";

        var isPlatformDomain = host.Equals(platformDomain, StringComparison.OrdinalIgnoreCase) ||
                               host.EndsWith("." + platformDomain, StringComparison.OrdinalIgnoreCase) ||
                               host.EndsWith(".mesafy.com", StringComparison.OrdinalIgnoreCase) ||
                               host.EndsWith(".mesafy.dev", StringComparison.OrdinalIgnoreCase);

        if (isPlatformDomain && parts.Length > 2 && !reservedSubdomains.Contains(parts[0]))
        {
            var subdomainSlug = parts[0];
            var subdomainTenant = await dbContext.Tenants
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Slug == subdomainSlug && t.IsActive);

            if (subdomainTenant != null)
            {
                tenantContext.SetTenant(subdomainTenant.Id, subdomainTenant.Slug);
                await _next(context);
                return;
            }
        }

        // 5. Plataforma Global Raíz (mesafy.doicela.dev, www.mesafy.doicela.dev) o desarrollo local en localhost sin slug:
        // No se asigna ningún tenant; tenantContext permanece con TenantId = null (Contexto Global Mesafy).
        // Se evita terminantemente el secuestro de la plataforma global mediante fallbacks estáticos a tenants particulares.
        if (isPlatformDomain || host == "localhost" || host == "127.0.0.1" || host == "::1")
        {
            await _next(context);
            return;
        }

        await _next(context);
    }
}
