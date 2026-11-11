namespace Delivery.Features.Branches.UpdateBranchOperatingHours;

public sealed record UpdateBranchOperatingHoursCommand(
    int BranchId,
    string OpeningTime,
    string ClosingTime,
    bool? IsActive = null,
    double? DeliveryRadiusKm = null,
    bool? IsCoverageStrict = null
);

public sealed record UpdateBranchOperatingHoursResponse(
    int BranchId,
    string Name,
    string OpeningTime,
    string ClosingTime,
    bool IsActive,
    double? DeliveryRadiusKm = null,
    bool IsCoverageStrict = true
);
