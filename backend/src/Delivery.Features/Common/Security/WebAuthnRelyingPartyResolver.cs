using Fido2NetLib;
using Delivery.Core.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Delivery.Features.Common.Security;

public class WebAuthnRelyingPartyResolver : IWebAuthnRelyingPartyResolver
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public WebAuthnRelyingPartyResolver(
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    public Fido2Configuration ResolveConfiguration(Tenant? tenant = null, string? clientOrigin = null)
    {
        var rpId = ResolveRpId(tenant, clientOrigin);
        var rpName = ResolveRpName(tenant);
        var origins = ResolveAllowedOrigins(rpId, clientOrigin, tenant);

        return new Fido2Configuration
        {
            RPID = rpId,
            RPName = rpName,
            Origins = origins,
            TimestampDriftTolerance = 300_000 // 5 minutos de tolerancia
        };
    }

    public string ResolveRpId(Tenant? tenant = null, string? clientOrigin = null)
    {
        // 1. Si se proporciona un origen del cliente explícito, derivar el host
        var host = GetHostFromOrigin(clientOrigin);

        // 2. Si no viene en el origen, consultar la cabecera Origin/Referer/Host de la petición actual
        if (string.IsNullOrWhiteSpace(host) && _httpContextAccessor.HttpContext != null)
        {
            var req = _httpContextAccessor.HttpContext.Request;
            var originHeader = req.Headers.Origin.FirstOrDefault();
            host = GetHostFromOrigin(originHeader);

            if (string.IsNullOrWhiteSpace(host))
            {
                var referer = req.Headers.Referer.FirstOrDefault();
                host = GetHostFromOrigin(referer);
            }

            if (string.IsNullOrWhiteSpace(host))
            {
                host = req.Host.Host;
            }
        }

        // 3. Si estamos en desarrollo local (localhost o 127.0.0.1)
        if (string.IsNullOrWhiteSpace(host) ||
            host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
            host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
        {
            return "localhost";
        }

        // 4. Si el tenant tiene un dominio personalizado explícito
        if (!string.IsNullOrWhiteSpace(tenant?.Settings?.CustomDomain))
        {
            var customDomain = tenant.Settings.CustomDomain.Trim().ToLowerInvariant();
            if (host.EndsWith(customDomain, StringComparison.OrdinalIgnoreCase))
            {
                return customDomain;
            }
        }

        // 5. Dominio de plataforma base (ej. mesafy.doicela.dev)
        var platformDomain = Environment.GetEnvironmentVariable("PLATFORM_DOMAIN")
            ?? _configuration["Multitenancy:PlatformDomain"]
            ?? "mesafy.doicela.dev";

        platformDomain = platformDomain.Trim().ToLowerInvariant();

        // Si el host actual es un subdominio de la plataforma (ej. la-granjita.mesafy.doicela.dev),
        // el RP ID canónico puede ser el dominio padre mesafy.doicela.dev para permitir passkeys unificadas
        if (host.EndsWith(platformDomain, StringComparison.OrdinalIgnoreCase))
        {
            return platformDomain;
        }

        // Fallback: usar el host del cliente
        return host.ToLowerInvariant();
    }

    public string ResolveRpName(Tenant? tenant = null)
    {
        if (!string.IsNullOrWhiteSpace(tenant?.Name))
        {
            return tenant.Name;
        }

        return "Mesafy Gastronomía";
    }

    private HashSet<string> ResolveAllowedOrigins(string rpId, string? clientOrigin, Tenant? tenant)
    {
        var origins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "http://localhost:3005",
            "http://127.0.0.1:3005",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5005",
            "https://localhost:5006"
        };

        // Orígenes de configuración CORS
        var configured = _configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (configured != null)
        {
            foreach (var orig in configured)
            {
                if (!string.IsNullOrWhiteSpace(orig)) origins.Add(orig.Trim());
            }
        }

        // Si se especificó clientOrigin explícito y es válido
        if (!string.IsNullOrWhiteSpace(clientOrigin) && Uri.TryCreate(clientOrigin, UriKind.Absolute, out var clientUri))
        {
            var normalized = $"{clientUri.Scheme}://{clientUri.Authority}";
            origins.Add(normalized);
        }

        // Si el RP ID no es localhost, añadir variantes HTTPS
        if (!rpId.Equals("localhost", StringComparison.OrdinalIgnoreCase))
        {
            origins.Add($"https://{rpId}");
            origins.Add($"https://www.{rpId}");

            if (tenant != null && !string.IsNullOrWhiteSpace(tenant.Slug))
            {
                origins.Add($"https://{tenant.Slug}.{rpId}");
            }
        }

        return origins;
    }

    private static string? GetHostFromOrigin(string? origin)
    {
        if (string.IsNullOrWhiteSpace(origin)) return null;

        if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
        {
            return uri.Host;
        }

        var parts = origin.Split(':');
        if (parts.Length > 0 && !string.IsNullOrWhiteSpace(parts[0]))
        {
            return parts[0].Replace("//", "").Trim('/');
        }

        return null;
    }
}
