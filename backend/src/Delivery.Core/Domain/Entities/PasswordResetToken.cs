namespace Delivery.Core.Domain.Entities;

/// <summary>
/// Token de un solo uso para la recuperación segura de contraseñas de usuarios.
/// Almacena un hash SHA-256 del token para evitar exposición en caso de fuga de base de datos.
/// </summary>
public class PasswordResetToken
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// Hash criptográfico SHA-256 del token generado aleatoriamente.
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UsedAt { get; set; }

    public string? CreatedByIp { get; set; }

    public bool IsActive => UsedAt == null && DateTime.UtcNow < ExpiresAt;
}

