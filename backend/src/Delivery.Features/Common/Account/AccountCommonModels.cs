using Delivery.Core.Common;

namespace Delivery.Features.Common.Account;

public static class AccountErrors
{
    public static readonly Error UserNotFound = new(
        "Account.UserNotFound",
        "El usuario solicitado no fue encontrado.");

    public static readonly Error InvalidCurrentPassword = new(
        "Account.InvalidCurrentPassword",
        "La contraseña actual proporcionada es incorrecta.");

    public static readonly Error PasswordsDoNotMatch = new(
        "Account.PasswordsDoNotMatch",
        "La nueva contraseña y su confirmación no coinciden.");

    public static readonly Error AddressNotFound = new(
        "Account.AddressNotFound",
        "La dirección solicitada no existe o no pertenece a tu cuenta.");

    public static readonly Error AddressLimitExceeded = new(
        "Account.AddressLimitExceeded",
        "Has alcanzado el límite máximo permitido de 10 direcciones guardadas.");
}

public sealed record AccountProfileDto(
    Guid Id,
    string FullName,
    string Email,
    string Phone,
    string? IdentificationType,
    string? IdentificationNumber,
    bool IsEmailVerified,
    DateTime CreatedAt,
    int TotalOrdersCount,
    int ActiveOrdersCount,
    bool WhatsAppConsentActive
);

public sealed record AccountAddressDto(
    Guid Id,
    string Title,
    string Street,
    string Reference,
    string City,
    double? Latitude,
    double? Longitude,
    bool IsDefault,
    DateTime CreatedAt
);
