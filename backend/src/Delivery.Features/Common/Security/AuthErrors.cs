using Delivery.Core.Common;

namespace Delivery.Features.Common.Security;

public static class AuthErrors
{
    public static readonly Error InvalidCredentials = new(
        "Auth.InvalidCredentials",
        "El correo electronico o la contrasena son incorrectos.");

    public static readonly Error UserInactive = new(
        "Auth.UserInactive",
        "La cuenta de usuario se encuentra inactiva o deshabilitada.");

    public static readonly Error TenantInactive = new(
        "Auth.TenantInactive",
        "La marca u organizacion asociada a esta cuenta se encuentra suspendida.");

    public static readonly Error InvalidRefreshToken = new(
        "Auth.InvalidRefreshToken",
        "El token de actualizacion es invalido, ha expirado o ya fue revocado.");

    public static readonly Error UserNotFound = new(
        "Auth.UserNotFound",
        "El usuario solicitado no fue encontrado.");

    public static readonly Error TenantNotFound = new(
        "Auth.TenantNotFound",
        "No se pudo determinar el tenant activo para la autenticacion.");

    public static readonly Error EmailAlreadyRegistered = new(
        "Auth.EmailAlreadyRegistered",
        "El correo electrónico ya se encuentra registrado.");

    public static readonly Error InvalidGoogleToken = new(
        "Auth.InvalidGoogleToken",
        "El token de autenticación de Google es inválido o ha expirado.");

    public static readonly Error GoogleEmailNotVerified = new(
        "Auth.GoogleEmailNotVerified",
        "La cuenta de Google no tiene un correo electrónico verificado.");

    public static readonly Error InvalidOrExpiredResetToken = new(
        "Auth.InvalidOrExpiredResetToken",
        "El enlace o token de recuperación es inválido, ha expirado o ya fue utilizado.");

    public static readonly Error InvalidOrExpiredVerificationToken = new(
        "Auth.InvalidOrExpiredVerificationToken",
        "El enlace o token de verificación es inválido, ha expirado o ya fue utilizado.");

    public static readonly Error EmailAlreadyVerified = new(
        "Auth.EmailAlreadyVerified",
        "El correo electrónico ya ha sido verificado previamente.");
}

