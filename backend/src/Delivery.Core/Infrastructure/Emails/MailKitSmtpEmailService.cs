using Delivery.Core.Common;
using Delivery.Core.Contracts.Emails;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Delivery.Core.Infrastructure.Emails;

/// <summary>
/// Implementación robusta de IEmailService basada en MailKit y MimeKit (estándar oficial de .NET).
/// Soporta negociación TLS moderna, autenticación con credenciales y modo de simulación para desarrollo.
/// </summary>
public sealed partial class MailKitSmtpEmailService : IEmailService
{
    private readonly SmtpOptions _options;
    private readonly IEmailTemplateEngine _templateEngine;
    private readonly ILogger<MailKitSmtpEmailService> _logger;

    [LoggerMessage(EventId = 1, Level = LogLevel.Warning, Message = "[SMTP Dev Simulation] Host SMTP no configurado o en modo mock. Correo simulado exitosamente para [{Recipients}] con asunto '{Subject}'.")]
    private static partial void LogDevSimulation(ILogger logger, string recipients, string subject);

    [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Correo electrónico despachado exitosamente mediante SMTP ({Host}:{Port}) hacia [{Recipients}]. Asunto: '{Subject}'.")]
    private static partial void LogEmailDispatchedSuccess(ILogger logger, string host, int port, string recipients, string subject);

    [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Fallo de autenticación con el servidor SMTP {Host}:{Port}.")]
    private static partial void LogAuthenticationFailed(ILogger logger, Exception ex, string host, int port);

    [LoggerMessage(EventId = 4, Level = LogLevel.Error, Message = "Error en comando del protocolo SMTP ({StatusCode}) al despachar hacia [{Host}].")]
    private static partial void LogSmtpCommandFailed(ILogger logger, Exception ex, SmtpStatusCode statusCode, string host);

    [LoggerMessage(EventId = 5, Level = LogLevel.Error, Message = "Fallo de conectividad de red con el host SMTP {Host}:{Port}.")]
    private static partial void LogConnectivityFailed(ILogger logger, Exception ex, string host, int port);

    [LoggerMessage(EventId = 6, Level = LogLevel.Error, Message = "Error no controlado durante el envío de correo hacia {Host}:{Port}.")]
    private static partial void LogUnhandledEmailSendError(ILogger logger, Exception ex, string host, int port);

    [LoggerMessage(EventId = 7, Level = LogLevel.Error, Message = "Error al componer o renderizar la plantilla de correo {TemplateType}.")]
    private static partial void LogTemplateRenderError(ILogger logger, Exception ex, EmailTemplateType templateType);

    public MailKitSmtpEmailService(
        IOptions<SmtpOptions> options,
        IEmailTemplateEngine templateEngine,
        ILogger<MailKitSmtpEmailService> logger)
    {
        _options = options.Value ?? new SmtpOptions();
        _templateEngine = templateEngine;
        _logger = logger;
    }

    public async Task<Result> SendEmailAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);

        if (message.To.Count == 0)
            return Result.Failure(EmailErrors.NoRecipients);

        if (string.IsNullOrWhiteSpace(message.Subject))
            return Result.Failure(EmailErrors.EmptySubject);

        if (string.IsNullOrWhiteSpace(message.HtmlBody) && string.IsNullOrWhiteSpace(message.PlainTextBody))
            return Result.Failure(EmailErrors.EmptyBody);

        // 1. Modo de Simulación de Desarrollo si el host no está configurado
        if (!_options.IsConfigured)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                var recipientList = string.Join(", ", message.To.Select(r => r.ToString()));
                LogDevSimulation(_logger, recipientList, message.Subject);
            }
            return Result.Success();
        }

        // 2. Construcción del mensaje MIME con MimeKit
        var mimeMessage = new MimeMessage();

        var senderEmail = !string.IsNullOrWhiteSpace(message.FromEmail) ? message.FromEmail : _options.SenderEmail;
        var senderName = !string.IsNullOrWhiteSpace(message.FromName) ? message.FromName : _options.SenderName;
        mimeMessage.From.Add(new MailboxAddress(senderName, senderEmail));

        if (!string.IsNullOrWhiteSpace(message.ReplyToEmail))
        {
            mimeMessage.ReplyTo.Add(new MailboxAddress(senderName, message.ReplyToEmail));
        }

        foreach (var to in message.To)
        {
            mimeMessage.To.Add(new MailboxAddress(to.Name ?? to.Email, to.Email));
        }

        foreach (var cc in message.Cc)
        {
            mimeMessage.Cc.Add(new MailboxAddress(cc.Name ?? cc.Email, cc.Email));
        }

        foreach (var bcc in message.Bcc)
        {
            mimeMessage.Bcc.Add(new MailboxAddress(bcc.Name ?? bcc.Email, bcc.Email));
        }

        mimeMessage.Subject = message.Subject;

        // 3. Composición multipart (HTML + Texto plano + Adjuntos)
        var builder = new BodyBuilder();

        if (!string.IsNullOrWhiteSpace(message.HtmlBody))
        {
            builder.HtmlBody = message.HtmlBody;
        }

        if (!string.IsNullOrWhiteSpace(message.PlainTextBody))
        {
            builder.TextBody = message.PlainTextBody;
        }

        foreach (var attachment in message.Attachments)
        {
            builder.Attachments.Add(attachment.FileName, attachment.Content, ContentType.Parse(attachment.ContentType));
        }

        mimeMessage.Body = builder.ToMessageBody();

        // 4. Despacho SMTP resiliente con MailKit
        using var client = new SmtpClient();
        client.Timeout = _options.TimeoutSeconds * 1000;

        try
        {
            var secureOption = !_options.EnableSsl
                ? SecureSocketOptions.None
                : _options.Port == 465
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTls;

            await client.ConnectAsync(_options.Host, _options.Port, secureOption, cancellationToken);

            if (_options.RequireAuthentication)
            {
                await client.AuthenticateAsync(_options.UserName ?? string.Empty, _options.Password ?? string.Empty, cancellationToken);
            }

            await client.SendAsync(mimeMessage, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                var recipientEmails = string.Join(", ", message.To.Select(t => t.Email));
                LogEmailDispatchedSuccess(_logger, _options.Host, _options.Port, recipientEmails, message.Subject);
            }

            return Result.Success();
        }
        catch (AuthenticationException ex)
        {
            LogAuthenticationFailed(_logger, ex, _options.Host, _options.Port);
            return Result.Failure(EmailErrors.AuthenticationFailed(ex.Message));
        }
        catch (SmtpCommandException ex)
        {
            LogSmtpCommandFailed(_logger, ex, ex.StatusCode, _options.Host);
            return Result.Failure(EmailErrors.SendFailed($"[{ex.StatusCode}] {ex.Message}"));
        }
        catch (Exception ex) when (ex is System.Net.Sockets.SocketException or System.IO.IOException or TimeoutException)
        {
            LogConnectivityFailed(_logger, ex, _options.Host, _options.Port);
            return Result.Failure(EmailErrors.SmtpConnectionFailed(ex.Message));
        }
        catch (Exception ex)
        {
            LogUnhandledEmailSendError(_logger, ex, _options.Host, _options.Port);
            return Result.Failure(EmailErrors.SendFailed(ex.Message));
        }
    }

    public async Task<Result> SendTemplatedEmailAsync<TModel>(
        string toEmail,
        string? toName,
        string subject,
        EmailTemplateType templateType,
        TModel model,
        Guid? tenantId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var (html, text) = _templateEngine.Render(templateType, model);

            var message = new EmailMessage(toEmail, subject, html, toName)
            {
                PlainTextBody = text,
                TenantId = tenantId
            };

            return await SendEmailAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            LogTemplateRenderError(_logger, ex, templateType);
            return Result.Failure(EmailErrors.TemplateNotFound(ex.Message));
        }
    }
}
