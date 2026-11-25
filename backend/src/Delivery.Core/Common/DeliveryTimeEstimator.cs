namespace Delivery.Core.Common;

/// <summary>
/// Estimador unificado de tiempos de entrega y retiro para Delivery Platform.
/// Cruza de forma determinista la capacidad en cocina (Redis / franja 20m),
/// la distancia geodésica real (km) calculada por Haversine/PostGIS,
/// y la modalidad operativa (Delivery a domicilio vs Retiro en local/mostrador).
/// </summary>
public static class DeliveryTimeEstimator
{
    public static string Estimate(double? distanceKm, bool isHighDemand, bool isSaturated, bool isTakeout = false)
    {
        if (isSaturated)
        {
            return "Pausado (Saturación)";
        }

        if (isTakeout)
        {
            // Retiro en local: solo tiempo de preparación en cocina
            return isHighDemand ? "25-35 min" : "15-20 min";
        }

        // Si no se proporcionó distancia o es radio estándar general (<= 5 km), usamos la base estándar del sistema (35-45 min / 60-75 min)
        if (!distanceKm.HasValue || distanceKm.Value <= 0)
        {
            return isHighDemand ? "60-75 min" : "35-45 min";
        }

        var dist = distanceKm.Value;

        if (dist <= 3.0)
        {
            // Radio corto muy cercano (0 - 3 km): ~10 min de trayecto
            return isHighDemand ? "50-65 min" : "30-40 min";
        }

        if (dist <= 6.0)
        {
            // Radio medio estándar (3 - 6 km)
            return isHighDemand ? "60-75 min" : "35-45 min";
        }

        if (dist <= 10.0)
        {
            // Radio extendido (6 - 10 km): mayor tiempo de viaje
            return isHighDemand ? "70-85 min" : "50-60 min";
        }

        // Más de 10 km
        return isHighDemand ? "85-100 min" : "65-80 min";
    }
}
