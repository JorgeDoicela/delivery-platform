using Delivery.Core.Common;

namespace Delivery.Core.Contracts.Emails;

/// <summary>
/// Motor de renderizado de plantillas HTML y texto plano para correos electrónicos.
/// </summary>
public interface IEmailTemplateEngine
{
    /// <summary>
    /// Renderiza una plantilla tipada retornando el cuerpo HTML y texto plano correspondientes.
    /// </summary>
    (string HtmlBody, string PlainTextBody) Render<TModel>(EmailTemplateType templateType, TModel model);
}

/// <summary>
/// Contrato desacoplado para el despacho directo e inmediato de correos electrónicos.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Envía un mensaje de correo electrónico previamente compuesto.
    /// </summary>
    Task<Result> SendEmailAsync(EmailMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Renderiza y envía un correo a partir de una plantilla tipada y su modelo de datos.
    /// </summary>
    Task<Result> SendTemplatedEmailAsync<TModel>(
        string toEmail,
        string? toName,
        string subject,
        EmailTemplateType templateType,
        TModel model,
        Guid? tenantId = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Contrato para encolar correos en segundo plano (Hangfire) sin bloquear hilos de petición HTTP.
/// </summary>
public interface IBackgroundEmailQueue
{
    /// <summary>
    /// Encola el despacho de un correo en la cola de notificaciones en segundo plano.
    /// </summary>
    void EnqueueEmail(EmailMessage message);

    /// <summary>
    /// Encola el despacho de un correo templado en segundo plano.
    /// </summary>
    void EnqueueTemplatedEmail<TModel>(
        string toEmail,
        string? toName,
        string subject,
        EmailTemplateType templateType,
        TModel model,
        Guid? tenantId = null);
}

