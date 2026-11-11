/**
 * Utilidades para decodificación e inspección segura de JSON Web Tokens (JWT).
 */

export interface DecodedJwtPayload {
  sub?: string;
  email?: string;
  role?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  iss?: string;
  aud?: string;
  [key: string]: unknown;
}

/**
 * Decodifica de forma segura el payload de un JWT sin validar su firma criptográfica.
 * Compatible tanto en navegadores (atob) como en entornos Node.js (Buffer).
 */
export function decodeJwtPayload(token: string | null | undefined): DecodedJwtPayload | null {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonString =
      typeof window !== "undefined" && typeof window.atob === "function"
        ? window.atob(payloadBase64)
        : Buffer.from(payloadBase64, "base64").toString("utf-8");

    return JSON.parse(jsonString) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

/**
 * Determina si un JWT ha expirado o está próximo a expirar dentro de una ventana de gracia.
 *
 * @param token Token JWT a evaluar.
 * @param graceWindowSeconds Margen de seguridad previo a la expiración en segundos (por defecto 30s).
 * @returns `true` si el token expiró o expira dentro de la ventana de gracia.
 *          `false` si el token es válido o si es un token mock de pruebas sin reclamo `exp`.
 */
export function isJwtExpired(token: string | null | undefined, graceWindowSeconds = 30): boolean {
  if (!token || typeof token !== "string") return true;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    // Si no contiene un campo exp numérico (ej: tokens sintéticos de test), no se marca como expirado
    return false;
  }

  const expirationMs = payload.exp * 1000;
  const thresholdMs = Date.now() + graceWindowSeconds * 1000;

  return thresholdMs >= expirationMs;
}
