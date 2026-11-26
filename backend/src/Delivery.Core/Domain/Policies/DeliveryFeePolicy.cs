namespace Delivery.Core.Domain.Policies;

public sealed record DeliveryFeeCalculationResult(
    decimal DeliveryFee,
    double StraightLineDistanceKm,
    double EstimatedRoadDistanceKm,
    bool IsDynamicByDistance,
    bool IsFreeByMinimumOrder
);

/// <summary>
/// Política de dominio única para calcular la tarifa de envío a domicilio.
/// Soporta tarifa fija por tenant/sucursal y tarifa dinámica por distancia vial estimada
/// (Haversine × factor de tortuosidad urbana), con tope máximo opcional y envío gratis por monto mínimo.
/// </summary>
public static class DeliveryFeePolicy
{
    /// <summary>
    /// Factor estándar de tortuosidad vial urbana sobre distancia geodésica en línea recta.
    /// </summary>
    public const double UrbanRoadFactor = 1.25;

    public static DeliveryFeeCalculationResult Calculate(
        decimal baseFee,
        bool enableDynamicDistanceFee,
        double baseDistanceKm,
        decimal extraFeePerKm,
        decimal? maxDeliveryFee,
        decimal? freeDeliveryMinOrderAmount,
        double? straightLineDistanceKm,
        decimal? orderSubtotal = null)
    {
        var safeBaseFee = Math.Round(Math.Max(0m, baseFee), 2, MidpointRounding.AwayFromZero);
        var safeStraightKm = straightLineDistanceKm.HasValue && straightLineDistanceKm.Value > 0
            ? Math.Round(straightLineDistanceKm.Value, 2, MidpointRounding.AwayFromZero)
            : 0.0;
        var estimatedRoadKm = safeStraightKm > 0
            ? Math.Round(safeStraightKm * UrbanRoadFactor, 2, MidpointRounding.AwayFromZero)
            : 0.0;

        if (freeDeliveryMinOrderAmount.HasValue
            && freeDeliveryMinOrderAmount.Value > 0m
            && orderSubtotal.HasValue
            && orderSubtotal.Value >= freeDeliveryMinOrderAmount.Value)
        {
            return new DeliveryFeeCalculationResult(
                DeliveryFee: 0.00m,
                StraightLineDistanceKm: safeStraightKm,
                EstimatedRoadDistanceKm: estimatedRoadKm,
                IsDynamicByDistance: enableDynamicDistanceFee && straightLineDistanceKm.HasValue,
                IsFreeByMinimumOrder: true
            );
        }

        if (!enableDynamicDistanceFee || !straightLineDistanceKm.HasValue)
        {
            return new DeliveryFeeCalculationResult(
                DeliveryFee: safeBaseFee,
                StraightLineDistanceKm: safeStraightKm,
                EstimatedRoadDistanceKm: estimatedRoadKm,
                IsDynamicByDistance: false,
                IsFreeByMinimumOrder: false
            );
        }

        var safeIncludedKm = Math.Max(0.0, baseDistanceKm);
        var safeExtraPerKm = Math.Max(0m, extraFeePerKm);
        var extraKm = Math.Max(0.0, estimatedRoadKm - safeIncludedKm);

        var rawFee = safeBaseFee + ((decimal)extraKm * safeExtraPerKm);

        // Redondeo comercial limpio a múltiplos de $0.05 para facilidad de cobro en efectivo
        var roundedFee = Math.Round(rawFee * 20m, 0, MidpointRounding.AwayFromZero) / 20m;

        if (maxDeliveryFee.HasValue && maxDeliveryFee.Value > 0m && roundedFee > maxDeliveryFee.Value)
        {
            roundedFee = maxDeliveryFee.Value;
        }

        var finalFee = Math.Round(Math.Max(0m, roundedFee), 2, MidpointRounding.AwayFromZero);

        return new DeliveryFeeCalculationResult(
            DeliveryFee: finalFee,
            StraightLineDistanceKm: safeStraightKm,
            EstimatedRoadDistanceKm: estimatedRoadKm,
            IsDynamicByDistance: true,
            IsFreeByMinimumOrder: false
        );
    }
}
