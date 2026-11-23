namespace Delivery.Features.Auth.WhatsAppOtp;

public static class WhatsAppOtpNormalizer
{
    public static string? Normalize(string? rawPhone)
    {
        if (string.IsNullOrWhiteSpace(rawPhone)) return null;

        var digits = new string(rawPhone.Where(char.IsDigit).ToArray());
        if (digits.Length < 7) return null;

        // Ecuador: si empieza con 09 y tiene 10 dígitos -> 5939...
        if (digits.StartsWith("09", StringComparison.Ordinal) && digits.Length == 10)
        {
            return "593" + digits[1..];
        }

        // Ecuador: si empieza con 9 y tiene 9 dígitos -> 5939...
        if (digits.StartsWith('9') && digits.Length == 9)
        {
            return "593" + digits;
        }

        // Ecuador: ya tiene prefijo 593...
        if (digits.StartsWith("593", StringComparison.Ordinal) && digits.Length == 12)
        {
            return digits;
        }

        // Otros números internacionales válidos (entre 10 y 15 dígitos)
        if (digits.Length >= 10 && digits.Length <= 15)
        {
            return digits;
        }

        return null;
    }
}
