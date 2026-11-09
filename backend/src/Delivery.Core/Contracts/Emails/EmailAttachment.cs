namespace Delivery.Core.Contracts.Emails;

/// <summary>
/// Archivo adjunto binario para ser incluido en un mensaje de correo electrónico.
/// </summary>
public sealed record EmailAttachment
{
    public string FileName { get; }
    public byte[] Content { get; }
    public string ContentType { get; }

    public EmailAttachment(string fileName, byte[] content, string contentType = "application/octet-stream")
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("El nombre del archivo adjunto no puede ser nulo ni vacío.", nameof(fileName));

        FileName = fileName.Trim();
        Content = content ?? throw new ArgumentNullException(nameof(content));
        ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim();
    }
}

