namespace Delivery.Core.Contracts.Storage;

/// <summary>
/// Contrato de almacenamiento y procesamiento de avatares de usuario.
/// Desacopla la persistencia física (disco local / uploads) de una futura
/// implementación en servicios Cloud de objetos (AWS S3, MinIO, Cloudflare R2 o GCS).
/// </summary>
public interface IAvatarStorage
{
    /// <summary>
    /// Valida, redimensiona y convierte una imagen a formato WebP optimizado,
    /// almacenándola en la partición correspondiente al tenant del usuario.
    /// </summary>
    /// <param name="imageStream">Stream de lectura del archivo de imagen original.</param>
    /// <param name="fileName">Nombre de archivo original con extensión.</param>
    /// <param name="userId">Identificador del usuario propietario del avatar.</param>
    /// <param name="tenantId">Identificador opcional del tenant (null para usuarios de plataforma o SuperAdmin).</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    /// <returns>Ruta o URL relativa/absoluta accesible públicamente para servir el avatar.</returns>
    Task<string> SaveAvatarAsync(
        Stream imageStream,
        string fileName,
        Guid userId,
        Guid? tenantId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Elimina el archivo físico o recurso del bucket correspondiente a una URL de avatar.
    /// </summary>
    Task DeleteAvatarAsync(string avatarUrl, CancellationToken cancellationToken = default);
}

