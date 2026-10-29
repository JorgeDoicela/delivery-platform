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
}

