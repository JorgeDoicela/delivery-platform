using System.Text.RegularExpressions;

namespace Delivery.Core.Contracts.Emails;

/// <summary>
/// Destinatario tipado e inmutable para el envío de correos electrónicos.
/// </summary>
public sealed record EmailRecipient
{
    private static readonly Regex EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase,
        TimeSpan.FromMilliseconds(250)
    );

    public string Email { get; }
    public string? Name { get; }

    public EmailRecipient(string email, string? name = null)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("El correo del destinatario no puede ser nulo ni vacío.", nameof(email));

        var trimmed = email.Trim();
        if (!EmailRegex.IsMatch(trimmed))
            throw new ArgumentException($"La dirección de correo '{email}' no posee un formato sintáctico válido.", nameof(email));

        Email = trimmed;
        Name = string.IsNullOrWhiteSpace(name) ? null : name.Trim();
    }

    public static bool TryCreate(string? email, string? name, out EmailRecipient? recipient)
    {
        recipient = null;
        if (string.IsNullOrWhiteSpace(email)) return false;

        var trimmed = email.Trim();
        if (!EmailRegex.IsMatch(trimmed)) return false;

        recipient = new EmailRecipient(trimmed, name);
        return true;
    }

    public override string ToString() =>
        string.IsNullOrEmpty(Name) ? Email : $"{Name} <{Email}>";
}

