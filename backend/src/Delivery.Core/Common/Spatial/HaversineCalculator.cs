namespace Delivery.Core.Common.Spatial;

/// <summary>
/// Proporciona cálculos geodésicos de alta precisión sobre la esfera terrestre
/// implementando la fórmula de Haversine para determinar la distancia de gran círculo.
/// </summary>
public static class HaversineCalculator
{
    /// <summary>
    /// Radio medio de la Tierra según la Unión Internacional de Geodesia y Geofísica (IUGG R1): 6371.0088 km.
    /// </summary>
    public const double EarthRadiusKm = 6371.0088;

    /// <summary>
    /// Calcula la distancia geodésica en kilómetros entre dos pares de coordenadas geográficas
    /// (Latitud, Longitud) en grados decimales (WGS84 / EPSG 4326).
    /// </summary>
    /// <param name="latitude1">Latitud del origen en grados decimales.</param>
    /// <param name="longitude1">Longitud del origen en grados decimales.</param>
    /// <param name="latitude2">Latitud del destino en grados decimales.</param>
    /// <param name="longitude2">Longitud del destino en grados decimales.</param>
    /// <returns>Distancia calculada en kilómetros (>= 0).</returns>
    public static double CalculateDistanceKm(double latitude1, double longitude1, double latitude2, double longitude2)
    {
        double dLat = ToRadians(latitude2 - latitude1);
        double dLon = ToRadians(longitude2 - longitude1);

        double lat1Rad = ToRadians(latitude1);
        double lat2Rad = ToRadians(latitude2);

        double sinHalfLat = Math.Sin(dLat / 2.0);
        double sinHalfLon = Math.Sin(dLon / 2.0);

        double a = (sinHalfLat * sinHalfLat) +
                   (Math.Cos(lat1Rad) * Math.Cos(lat2Rad) * sinHalfLon * sinHalfLon);

        // Clamping defensivo ante imprecisiones numéricas de punto flotante en antípodas o puntos casi idénticos
        a = Math.Min(1.0, Math.Max(0.0, a));

        double c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));
        return EarthRadiusKm * c;
    }

    /// <summary>
    /// Determina si un punto geográfico se encuentra dentro del radio máximo especificado
    /// respecto a un centro geográfico.
    /// </summary>
    public static bool IsWithinRadiusKm(
        double centerLatitude,
        double centerLongitude,
        double targetLatitude,
        double targetLongitude,
        double radiusKm)
    {
        if (radiusKm <= 0.0)
        {
            return false;
        }

        var distanceKm = CalculateDistanceKm(centerLatitude, centerLongitude, targetLatitude, targetLongitude);
        return distanceKm <= radiusKm;
    }

    private static double ToRadians(double degrees) => degrees * (Math.PI / 180.0);
}

