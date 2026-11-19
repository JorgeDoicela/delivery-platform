namespace Delivery.Core.Domain.Entities;

public class WebAuthnCredential
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    /// <summary>
    /// Identificador único de la credencial emitido por el authenticator (raw ID binario).
    /// </summary>
    public byte[] CredentialId { get; set; } = [];

    /// <summary>
    /// Clave pública COSE en formato binario.
    /// </summary>
    public byte[] PublicKey { get; set; } = [];

    /// <summary>
    /// Contador de firmas para prevenir ataques de replay o autenticadores clonados.
    /// </summary>
    public uint SignCount { get; set; }

    /// <summary>
    /// Formato de atestación ("none", "packed", "fido-u2f", "android-key", "apple").
    /// </summary>
    public string AttestationFormat { get; set; } = "none";

    /// <summary>
    /// Identificador único del fabricante del authenticator (AAGUID).
    /// </summary>
    public Guid AaGuid { get; set; }

    /// <summary>
    /// Tipo de credencial ("public-key").
    /// </summary>
    public string CredentialType { get; set; } = "public-key";

    /// <summary>
    /// Nombre amigable asignado por el usuario o detectado del dispositivo (ej. "iPhone 15 - Touch ID", "Windows Hello").
    /// </summary>
    public string FriendlyName { get; set; } = string.Empty;

    /// <summary>
    /// Tipo de autenticador: "platform" (biometría integrada) o "cross-platform" (llave de seguridad USB/NFC).
    /// </summary>
    public string? AuthenticatorType { get; set; }

    /// <summary>
    /// Transportes soportados serializados en formato JSON (ej. ["internal"], ["usb", "nfc"]).
    /// </summary>
    public string? TransportsJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
    public bool IsActive { get; set; } = true;
}
