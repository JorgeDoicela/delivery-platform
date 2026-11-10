using Delivery.Core.Contracts.Storage;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SkiaSharp;

namespace Delivery.Features.Common.Services;

/// <summary>
/// Implementación local de IAvatarStorage.
/// Procesa y optimiza imágenes fotográficas convirtiéndolas a WebP (85% calidad, 400x400 px)
/// organizadas por directorio multitenant: uploads/avatars/{tenantId}/{userId}_{timestamp}.webp
/// </summary>
public sealed class LocalAvatarStorage : IAvatarStorage
{
    private const int TargetAvatarDimension = 400;
    private const int WebpQuality = 85;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<LocalAvatarStorage> _logger;

    public LocalAvatarStorage(IHostEnvironment environment, ILogger<LocalAvatarStorage> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public async Task<string> SaveAvatarAsync(
        Stream imageStream,
        string fileName,
        Guid userId,
        Guid? tenantId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(imageStream);

        if (imageStream.CanSeek)
        {
            imageStream.Position = 0;
        }

        // 1. Decodificar la imagen mediante SkiaSharp garantizando que sea una foto genuina
        using var originalBitmap = SKBitmap.Decode(imageStream);
        if (originalBitmap is null)
        {
            throw new InvalidOperationException("El archivo proporcionado no contiene un formato de imagen válido o decodificable.");
        }

        // 2. Calcular recorte centrado cuadrado (Aspect Ratio 1:1)
        var width = originalBitmap.Width;
        var height = originalBitmap.Height;
        var squareDimension = Math.Min(width, height);

        var srcRect = new SKRectI(
            (width - squareDimension) / 2,
            (height - squareDimension) / 2,
            (width + squareDimension) / 2,
            (height + squareDimension) / 2);

        using var croppedBitmap = new SKBitmap(squareDimension, squareDimension);
        using (var canvas = new SKCanvas(croppedBitmap))
        {
            canvas.Clear(SKColors.Transparent);
            using var originalImage = SKImage.FromBitmap(originalBitmap);
            canvas.DrawImage(originalImage, srcRect, new SKRect(0, 0, squareDimension, squareDimension), new SKSamplingOptions(SKFilterMode.Linear));
        }

        // 3. Redimensionar a dimensión de avatar estándar (400x400) con muestreo lineal de alta calidad
        var finalSize = Math.Min(squareDimension, TargetAvatarDimension);
        using var resizedBitmap = croppedBitmap.Resize(new SKImageInfo(finalSize, finalSize), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear)) ?? croppedBitmap;
        using var finalImage = SKImage.FromBitmap(resizedBitmap);

        // 4. Codificar a WebP optimizado
        using var webpData = finalImage.Encode(SKEncodedImageFormat.Webp, WebpQuality);
        if (webpData is null || webpData.IsEmpty)
        {
            throw new InvalidOperationException("No fue posible codificar la imagen al formato WebP.");
        }

        // 5. Particionamiento Multi-Tenant de almacenamiento local
        var tenantFolder = tenantId.HasValue ? tenantId.Value.ToString("D") : "platform";
        var uploadsDir = Path.Combine(_environment.ContentRootPath, "uploads", "avatars", tenantFolder);
        Directory.CreateDirectory(uploadsDir);

        // Limpiar archivos anteriores del mismo usuario para evitar acumulación
        try
        {
            var pattern = $"{userId}_*.webp";
            foreach (var oldFile in Directory.GetFiles(uploadsDir, pattern))
            {
                try
                {
                    File.Delete(oldFile);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "No se pudo eliminar el avatar antiguo {OldFile}", oldFile);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error intentando limpiar avatares previos del usuario {UserId}", userId);
        }

        // 6. Escribir archivo WebP en disco
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var uniqueFileName = $"{userId}_{timestamp}.webp";
        var fullPath = Path.Combine(uploadsDir, uniqueFileName);

        await using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, useAsync: true))
        {
            webpData.SaveTo(fileStream);
        }

        _logger.LogInformation("Avatar guardado exitosamente en {Path} para usuario {UserId}", fullPath, userId);

        // Retornar ruta relativa web utilizable
        return $"/uploads/avatars/{tenantFolder}/{uniqueFileName}";
    }

    public Task DeleteAvatarAsync(string avatarUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            return Task.CompletedTask;
        }

        try
        {
            var cleanRelative = avatarUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(_environment.ContentRootPath, cleanRelative);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.LogInformation("Avatar eliminado físicamente de {Path}", fullPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error al eliminar archivo físico de avatar {Url}", avatarUrl);
        }

        return Task.CompletedTask;
    }
}

