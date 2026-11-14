using System.Globalization;
using System.Text.RegularExpressions;

namespace Delivery.Features.Chatbot.WhatsAppWebhook;

public sealed record WhatsAppExtractedLocation(
    double Latitude,
    double Longitude,
    string? Name,
    string? Address,
    bool IsLiveLocation
);

public static partial class WhatsAppLocationParser
{
    public static WhatsAppExtractedLocation? ExtractLocation(WhatsAppIncomingMessage incoming)
    {
        if (incoming == null) return null;

        // 1. Mensaje nativo de ubicación de WhatsApp (Type == "location")
        if (string.Equals(incoming.Type, "location", StringComparison.OrdinalIgnoreCase) && incoming.Location != null)
        {
            var loc = incoming.Location;
            if (IsValidCoordinate(loc.Latitude, loc.Longitude))
            {
                var isLive = loc.IsLive == true ||
                             (!string.IsNullOrWhiteSpace(loc.Url) &&
                              (loc.Url.Contains("live", StringComparison.OrdinalIgnoreCase) ||
                               loc.Url.Contains("realtime", StringComparison.OrdinalIgnoreCase) ||
                               loc.Url.Contains("tiempo_real", StringComparison.OrdinalIgnoreCase)));

                return new WhatsAppExtractedLocation(
                    loc.Latitude,
                    loc.Longitude,
                    loc.Name,
                    loc.Address,
                    isLive
                );
            }
        }

        // 2. Mensaje de texto que contiene enlaces de mapas satelitales o coordenadas geográficas
        var textBody = incoming.Text?.Body;
        if (!string.IsNullOrWhiteSpace(textBody))
        {
            return ExtractFromText(textBody);
        }

        return null;
    }

    public static WhatsAppExtractedLocation? ExtractFromText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var isLive = LiveLocationKeywordRegex().IsMatch(text);

        // A. Google Maps query q=lat,lng
        var match = GoogleMapsQueryRegex().Match(text);
        if (match.Success &&
            double.TryParse(match.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var gLat) &&
            double.TryParse(match.Groups[2].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var gLng) &&
            IsValidCoordinate(gLat, gLng))
        {
            return new WhatsAppExtractedLocation(gLat, gLng, null, null, isLive);
        }

        // B. Apple Maps ll=lat,lng
        match = AppleMapsQueryRegex().Match(text);
        if (match.Success &&
            double.TryParse(match.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var aLat) &&
            double.TryParse(match.Groups[2].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var aLng) &&
            IsValidCoordinate(aLat, aLng))
        {
            return new WhatsAppExtractedLocation(aLat, aLng, null, null, isLive);
        }

        // C. Geo URI geo:lat,lng
        match = GeoUriRegex().Match(text);
        if (match.Success &&
            double.TryParse(match.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var geoLat) &&
            double.TryParse(match.Groups[2].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var geoLng) &&
            IsValidCoordinate(geoLat, geoLng))
        {
            return new WhatsAppExtractedLocation(geoLat, geoLng, null, null, isLive);
        }

        // D. Coordenadas explícitas en texto (ej. -0.29381, -78.54921)
        match = RawCoordinatesRegex().Match(text);
        if (match.Success &&
            double.TryParse(match.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var rawLat) &&
            double.TryParse(match.Groups[2].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var rawLng) &&
            IsValidCoordinate(rawLat, rawLng))
        {
            return new WhatsAppExtractedLocation(rawLat, rawLng, null, null, isLive);
        }

        return null;
    }

    private static bool IsValidCoordinate(double latitude, double longitude)
    {
        if (latitude < -90.0 || latitude > 90.0) return false;
        if (longitude < -180.0 || longitude > 180.0) return false;
        // Excluir punto nulo (0,0) como coordenada espuria
        if (Math.Abs(latitude) < 0.000001 && Math.Abs(longitude) < 0.000001) return false;
        return true;
    }

    [GeneratedRegex(@"(?:google\.com/maps|maps\.google\.com)[^\s]*[?&](?:q|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex GoogleMapsQueryRegex();

    [GeneratedRegex(@"maps\.apple\.com[^\s]*[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex AppleMapsQueryRegex();

    [GeneratedRegex(@"geo:(-?\d+\.\d+),(-?\d+\.\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex GeoUriRegex();

    [GeneratedRegex(@"(?:(?:ubicaci[oó]n|coordenadas|gps)\s*:?\s*)?(-?\d{1,2}\.\d{4,9})\s*,\s*(-?\d{1,3}\.\d{4,9})", RegexOptions.IgnoreCase)]
    private static partial Regex RawCoordinatesRegex();

    [GeneratedRegex(@"(?:tiempo\s*real|en\s*vivo|live(?:\s*location)?|tiempo_real)", RegexOptions.IgnoreCase)]
    private static partial Regex LiveLocationKeywordRegex();
}
