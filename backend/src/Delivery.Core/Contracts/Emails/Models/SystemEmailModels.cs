namespace Delivery.Core.Contracts.Emails.Models;

/// <summary>
/// Modelo de datos para correos de bienvenida de nuevos clientes o usuarios.
/// </summary>
public sealed record WelcomeEmailModel
{
    public BrandEmailContext Brand { get; init; } = new();
    public string UserName { get; init; } = string.Empty;
    public string UserEmail { get; init; } = string.Empty;
    public string LoginUrl { get; init; } = string.Empty;
}

/// <summary>
/// Modelo de datos para envío de códigos de seguridad y tokens de verificación.
/// </summary>
public sealed record SecurityPinEmailModel
{
    public BrandEmailContext Brand { get; init; } = new();
    public string UserName { get; init; } = string.Empty;
    public string PinCode { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 15;
    public string Purpose { get; init; } = "verificar tu cuenta o restablecer tu contraseña";
}

/// <summary>
/// Modelo de datos para solicitud de restablecimiento de contraseña de usuario.
/// </summary>
public sealed record PasswordResetEmailModel
{
    public BrandEmailContext Brand { get; init; } = new();
    public string UserName { get; init; } = string.Empty;
    public string ResetUrl { get; init; } = string.Empty;
    public string ResetToken { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 30;
}

/// <summary>
/// Modelo de datos para solicitud de verificación de correo electrónico tras creación de sesión/cuenta.
/// </summary>
public sealed record EmailVerificationEmailModel
{
    public BrandEmailContext Brand { get; init; } = new();
    public string UserName { get; init; } = string.Empty;
    public string UserEmail { get; init; } = string.Empty;
    public string VerificationUrl { get; init; } = string.Empty;
    public string VerificationToken { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 1440;
}

/// <summary>
/// Modelo de datos para validación y diagnóstico de la infraestructura SMTP.
/// </summary>
public sealed record TestEmailModel
{
    public BrandEmailContext Brand { get; init; } = new();
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; }
    public bool SslEnabled { get; init; }
    public string SenderEmail { get; init; } = string.Empty;
    public DateTime SentAt { get; init; } = DateTime.UtcNow;
    public string EnvironmentName { get; init; } = "Production";
}

