using System.Reflection;
using System.Text.Json;

namespace Delivery.Core.Infrastructure.Persistence.Corpus;

/// <summary>
/// Cargador resiliente de corpus gastronómicos.
/// Busca archivos en disco (entornos de desarrollo y servidores) con fallback automático
/// a recursos embebidos en el ensamblado (entornos contenerizados y pruebas unitarias aisladas).
/// </summary>
public static class CorpusCatalogLoader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    public static TenantCatalogCorpus? Load(string tenantSlug)
    {
        if (string.IsNullOrWhiteSpace(tenantSlug)) return null;

        var normalizedSlug = tenantSlug.Trim().ToLowerInvariant();
        var fileName = $"catalog.{normalizedSlug}.json";

        // 1. Búsqueda en rutas relativas al directorio base de ejecución
        var searchPaths = new List<string>
        {
            Path.Combine(AppContext.BaseDirectory, "Corpus", fileName),
            Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Persistence", "Corpus", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "Corpus", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "Persistence", "Corpus", fileName)
        };

        // 2. Búsqueda hacia arriba en el árbol de directorios (desarrollo local / tests)
        var currentDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        for (int i = 0; i < 5 && currentDir != null; i++)
        {
            var candidate = Path.Combine(
                currentDir.FullName,
                "backend", "src", "Delivery.Core", "Infrastructure", "Persistence", "Corpus", fileName
            );
            searchPaths.Add(candidate);

            var directCandidate = Path.Combine(
                currentDir.FullName,
                "Infrastructure", "Persistence", "Corpus", fileName
            );
            searchPaths.Add(directCandidate);

            currentDir = currentDir.Parent;
        }

        foreach (var path in searchPaths.Distinct())
        {
            if (File.Exists(path))
            {
                try
                {
                    var json = File.ReadAllText(path);
                    var parsed = JsonSerializer.Deserialize<TenantCatalogCorpus>(json, JsonOptions);
                    if (parsed != null) return parsed;
                }
                catch
                {
                    // Continúa con la siguiente estrategia si el archivo local está temporalmente bloqueado
                }
            }
        }

        // 3. Fallback a recurso embebido en el ensamblado
        var assembly = typeof(CorpusCatalogLoader).Assembly;
        var resourceName = $"Delivery.Core.Infrastructure.Persistence.Corpus.{fileName}";

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream != null)
        {
            using var reader = new StreamReader(stream);
            var embeddedJson = reader.ReadToEnd();
            return JsonSerializer.Deserialize<TenantCatalogCorpus>(embeddedJson, JsonOptions);
        }

        return null;
    }
}

