namespace Delivery.Core.Domain.Entities;

/// <summary>
/// Token de un solo uso para la verificación de correo electrónico del usuario.
/// Almacena un hash SHA-256 del token plano enviado al correo para evitar exposición ante fugas.
/// </summary>
public class EmailVerificationToken
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

