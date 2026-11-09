using Delivery.Core.Common;

namespace Delivery.Core.Contracts.Emails;

/// <summary>
/// Errores tipados y estandarizados para operaciones de mensajería electrónica.
/// </summary>
public static class EmailErrors
{
    public static readonly Error NoRecipients = new(
        "Email.NoRecipients",
        "El mensaje de correo debe incluir al menos un destinatario válido."
    );

    public static readonly Error EmptySubject = new(
        "Email.EmptySubject",
        "El asunto del correo no puede estar vacío."
    );

    public static readonly Error EmptyBody = new(
        "Email.EmptyBody",
        "El mensaje debe incluir contenido en texto plano o HTML."
    );

    public static Error SmtpConnectionFailed(string details) => new(
        "Email.SmtpConnectionFailed",
        $"No se pudo establecer la conexión con el servidor SMTP: {details}"
    );

    public static Error AuthenticationFailed(string details) => new(
        "Email.AuthenticationFailed",
        $"Falló la autenticación con el servidor SMTP: {details}"
    );

    public static Error SendFailed(string details) => new(
        "Email.SendFailed",
        $"Ocurrió un error al despachar el mensaje mediante el protocolo SMTP: {details}"
    );

    public static Error TemplateNotFound(string templateName) => new(
        "Email.TemplateNotFound",
        $"La plantilla de correo solicitada '{templateName}' no existe o no pudo ser renderizada."
    );
}

