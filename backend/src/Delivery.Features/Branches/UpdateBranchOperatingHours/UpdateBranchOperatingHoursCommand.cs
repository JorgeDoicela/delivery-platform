namespace Delivery.Features.Branches.UpdateBranchOperatingHours;

public sealed record UpdateBranchOperatingHoursCommand(
    int BranchId,
    string OpeningTime,
    string ClosingTime,
    bool? IsActive = null,
    double? DeliveryRadiusKm = null,
    bool? IsCoverageStrict = null,
    bool? EnableKitchenWorkflowOverride = null,
    bool? AllowDirectCounterTakeoutDeliveryOverride = null,
    bool ApplyWorkflowOverrides = false,
    decimal? BaseDeliveryFeeOverride = null,
    bool ApplyDeliveryFeeOverride = false
);

public sealed record UpdateBranchOperatingHoursResponse(
    int BranchId,
    string Name,
    string OpeningTime,
    string ClosingTime,
    bool IsActive,
    double? DeliveryRadiusKm = null,
    bool IsCoverageStrict = true,
    bool? EnableKitchenWorkflowOverride = null,
    bool UseKitchenWorkflow = true,
    bool? AllowDirectCounterTakeoutDeliveryOverride = null,
    bool AllowDirectCounterTakeoutDelivery = true,
    decimal? BaseDeliveryFeeOverride = null,
    decimal EffectiveDeliveryFee = 1.50m
);
