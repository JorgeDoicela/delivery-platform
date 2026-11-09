namespace Delivery.Core.Contracts.Emails;

/// <summary>
/// Opciones de configuración fuertemente tipadas para el servidor de correo SMTP.
/// Admite inyección desde appsettings.json (sección "Smtp") o variables de entorno estándar.
/// </summary>
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    /// <summary>
    /// Dirección del servidor SMTP (ej. smtp.gmail.com, smtp.resend.com, mail.servidor.com).
    /// Si está vacío o configurado como "mock"/"localhost-disabled", el sistema opera en modo simulación de desarrollo.
    /// </summary>
    public string Host { get; set; } = string.Empty;

    /// <summary>
    /// Puerto de conexión SMTP (comúnmente 587 para STARTTLS, 465 para SSL/TLS implícito, 25 para relevo sin cifrado).
    /// </summary>
    public int Port { get; set; } = 587;

    /// <summary>
    /// Habilita cifrado de transporte TLS/SSL.
    /// </summary>
    public bool EnableSsl { get; set; } = true;

    /// <summary>
    /// Nombre de usuario o cuenta de autenticación SMTP.
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// Contraseña o App Password de autenticación SMTP.
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Dirección de remitente por defecto (ej. no-reply@mesafy.doicela.dev).
    /// </summary>
    public string SenderEmail { get; set; } = "no-reply@mesafy.doicela.dev";

    /// <summary>
    /// Nombre visible del remitente por defecto (ej. Mesafy Gastronomía).
    /// </summary>
    public string SenderName { get; set; } = "Mesafy Gastronomía";

    /// <summary>
    /// Tiempo límite en segundos para la conexión y protocolo SMTP.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 15;

    /// <summary>
    /// Determina si las credenciales de host son válidas para un servidor real.
    /// </summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host) &&
        !string.Equals(Host, "mock", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(Host, "disabled", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Determina si el servidor requiere autenticación de usuario y clave.
    /// </summary>
    public bool RequireAuthentication =>
        !string.IsNullOrWhiteSpace(UserName) && !string.IsNullOrWhiteSpace(Password);
}

