namespace Delivery.Core.Contracts.Emails;

/// <summary>
/// Mensaje de correo electrónico agnóstico y desacoplado de librerías de infraestructura.
/// </summary>
public sealed class EmailMessage
{
    public List<EmailRecipient> To { get; } = new();
    public List<EmailRecipient> Cc { get; } = new();
    public List<EmailRecipient> Bcc { get; } = new();

    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? PlainTextBody { get; set; }

    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
    public string? ReplyToEmail { get; set; }

    public List<EmailAttachment> Attachments { get; } = new();

    /// <summary>
    /// Identificador opcional del restaurante asociado para fines de observabilidad y branding.
    /// </summary>
    public Guid? TenantId { get; set; }

    public EmailMessage() { }

    public EmailMessage(string toEmail, string subject, string htmlBody, string? toName = null)
    {
        To.Add(new EmailRecipient(toEmail, toName));
        Subject = subject;
        HtmlBody = htmlBody;
    }
}

