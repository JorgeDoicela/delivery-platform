using Delivery.Core.Contracts.Emails;
using Hangfire;
using Hangfire.States;

namespace Delivery.Features.Common.Services;

/// <summary>
/// Despachador de correos electrónicos en segundo plano respaldado por la cola 'notifications' de Hangfire.
/// Garantiza que los hilos de petición HTTP no queden bloqueados esperando el protocolo SMTP y proporciona reintentos automáticos ante caídas transitorias.
/// </summary>
[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1711:Identifiers should not have incorrect suffix", Justification = "Implementación de cola de trabajos en segundo plano con Hangfire.")]
public sealed class HangfireBackgroundEmailQueue : IBackgroundEmailQueue
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public HangfireBackgroundEmailQueue(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public void EnqueueEmail(EmailMessage message)
    {
        ArgumentNullException.ThrowIfNull(message);

        _backgroundJobClient.Create<IEmailService>(
            s => s.SendEmailAsync(message, CancellationToken.None),
            new EnqueuedState("notifications")
        );
    }

    public void EnqueueTemplatedEmail<TModel>(
        string toEmail,
        string? toName,
        string subject,
        EmailTemplateType templateType,
        TModel model,
        Guid? tenantId = null)
    {
        if (string.IsNullOrWhiteSpace(toEmail)) throw new ArgumentException("El destinatario no puede ser nulo ni vacío.", nameof(toEmail));

        _backgroundJobClient.Create<IEmailService>(
            s => s.SendTemplatedEmailAsync(toEmail, toName, subject, templateType, model, tenantId, CancellationToken.None),
            new EnqueuedState("notifications")
        );
    }
}
