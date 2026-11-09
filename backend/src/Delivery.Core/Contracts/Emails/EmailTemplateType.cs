namespace Delivery.Core.Contracts.Emails;

/// <summary>
/// Tipos de plantillas HTML predefinidas y parametrizadas para la plataforma.
/// </summary>
public enum EmailTemplateType
{
    /// <summary>
    /// Confirmación de orden de compra recibida con desglose financiero y dirección.
    /// </summary>
    OrderConfirmation,

    /// <summary>
    /// Notificación de cambio de estado de orden (En preparación, En ruta, Entregado).
    /// </summary>
    OrderStatusChanged,

    /// <summary>
    /// Bienvenida de nuevo cliente o registro de usuario operativo.
    /// </summary>
    WelcomeUser,

    /// <summary>
    /// Código de seguridad o token de recuperación de contraseña.
    /// </summary>
    SecurityPin,

    /// <summary>
    /// Solicitud de restablecimiento de contraseña con botón de acción y token de un solo uso.
    /// </summary>
    PasswordReset,

    /// <summary>
    /// Verificación de correo electrónico tras la creación de sesión o registro de cuenta.
    /// </summary>
    EmailVerification,

    /// <summary>
    /// Correo de prueba y validación de infraestructura SMTP.
    /// </summary>
    TestEmail,
}

