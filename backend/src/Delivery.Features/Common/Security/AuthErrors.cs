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

    public static readonly Error PasskeyChallengeExpired = new(
        "Auth.PasskeyChallengeExpired",
        "El desafío de autenticación biométrica ha expirado o no es válido. Por favor, intenta de nuevo.");

    public static readonly Error PasskeyVerificationFailed = new(
        "Auth.PasskeyVerificationFailed",
        "La verificación criptográfica de la llave de acceso o biometría (Passkey) ha fallado.");

    public static readonly Error PasskeyNotFound = new(
        "Auth.PasskeyNotFound",
        "No se encontró una llave de acceso válida para esta cuenta.");

    public static readonly Error PasskeyAlreadyRegistered = new(
        "Auth.PasskeyAlreadyRegistered",
        "Esta llave de acceso ya se encuentra registrada en la cuenta.");

    public static readonly Error PasskeyCloneDetected = new(
        "Auth.PasskeyCloneDetected",
        "Alerta de seguridad: se detectó una discrepancia en el contador de firmas del dispositivo. Se rechazó el acceso por precaución.");

    public static readonly Error PasskeyNotBelongsToUser = new(
        "Auth.PasskeyNotBelongsToUser",
        "La llave de acceso especificada no pertenece al usuario actual.");

    public static readonly Error WebAuthnCredentialNotFound = PasskeyNotFound;

    public static readonly Error UnauthorizedTenant = new(
        "Auth.UnauthorizedTenant",
        "El usuario no tiene autorización para operar en el establecimiento seleccionado.");

    public static Error WebAuthnVerificationFailed(string detail) => new(
        "Auth.WebAuthnVerificationFailed",
        $"La verificación criptográfica de la llave de acceso falló: {detail}");
}

