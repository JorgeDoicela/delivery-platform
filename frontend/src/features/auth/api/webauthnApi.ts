import {
  ApiClientError,
  getApiClientAccessToken,
  getApiClientTenantSlug,
  getApiBaseUrl,
} from "@/shared/lib/api-client";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/browser";
import type { LoginResponse } from "../types";

export interface WebAuthnLoginOptionsResponse {
  options: PublicKeyCredentialRequestOptionsJSON;
  sessionId: string;
}

export interface WebAuthnCredentialItem {
  id: string;
  friendlyName: string;
  authenticatorType?: string | null;
  attestationFormat: string;
  createdAt: string;
  lastUsedAt?: string | null;
  signCount: number;
}

async function handleWebAuthnResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Error en el servicio de autenticación biométrica.";
    let code = `HTTP_${response.status}`;

    try {
      const json = await response.json();
      if (json.detail) {
        message = json.detail;
      } else if (json.message) {
        message = json.message;
      } else if (json.title) {
        message = json.title;
      }

      if (json.code) {
        code = json.code;
      }
    } catch {
      // Fallback a mensaje estándar
    }

    throw new ApiClientError(message, code, response.status);
  }

  return response.json();
}

function getAuthHeaders(includeTenant = true): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getApiClientAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (includeTenant) {
    const tenantSlug = getApiClientTenantSlug();
    if (tenantSlug) {
      headers["X-Tenant-Slug"] = tenantSlug;
    }
  }

  return headers;
}

export const webauthnApi = {
  /**
   * Obtiene las opciones de desafío para registrar una nueva Passkey (requiere estar autenticado).
   */
  async getRegistrationOptions(tenantSlug?: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const slug = tenantSlug || getApiClientTenantSlug();
    const url = `${getApiBaseUrl()}/api/v1/auth/webauthn/register/options`;

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify({ tenantSlug: slug }),
    });

    return handleWebAuthnResponse<PublicKeyCredentialCreationOptionsJSON>(response);
  },

  /**
   * Envía la respuesta de atestación del navegador para verificar y almacenar la Passkey.
   */
  async completeRegistration(
    attestation: RegistrationResponseJSON,
    friendlyName?: string,
    tenantSlug?: string
  ): Promise<WebAuthnCredentialItem> {
    const slug = tenantSlug || getApiClientTenantSlug();
    const url = `${getApiBaseUrl()}/api/v1/auth/webauthn/register/complete`;

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify({
        attestation,
        friendlyName,
        tenantSlug: slug,
      }),
    });

    return handleWebAuthnResponse<WebAuthnCredentialItem>(response);
  },

  /**
   * Obtiene las opciones de aserción para iniciar sesión con Passkey (público / anónimo).
   */
  async getLoginOptions(email?: string, tenantSlug?: string): Promise<WebAuthnLoginOptionsResponse> {
    const slug = tenantSlug || getApiClientTenantSlug();
    const url = `${getApiBaseUrl()}/api/v1/auth/webauthn/login/options`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(slug ? { "X-Tenant-Slug": slug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({
        email: email || null,
        tenantSlug: slug,
      }),
    });

    return handleWebAuthnResponse<WebAuthnLoginOptionsResponse>(response);
  },

  /**
   * Envía la aserción criptográfica firmada por el authenticator para iniciar sesión y emitir JWT.
   */
  async completeLogin(
    sessionId: string,
    assertion: AuthenticationResponseJSON,
    tenantSlug?: string
  ): Promise<LoginResponse> {
    const slug = tenantSlug || getApiClientTenantSlug();
    const url = `${getApiBaseUrl()}/api/v1/auth/webauthn/login/complete`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(slug ? { "X-Tenant-Slug": slug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({
        sessionId,
        assertion,
        tenantSlug: slug,
      }),
    });

    return handleWebAuthnResponse<LoginResponse>(response);
  },

  /**
   * Lista todas las llaves de acceso registradas por el usuario actual.
   */
  async getCredentials(): Promise<WebAuthnCredentialItem[]> {
    const url = `${getApiBaseUrl()}/api/v1/auth/webauthn/credentials`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(false),
      credentials: "include",
    });

    return handleWebAuthnResponse<WebAuthnCredentialItem[]>(response);
  },

  /**
   * Elimina una Passkey por su identificador.
   */
  async deleteCredential(id: string): Promise<void> {
    const url = `${getApiBaseUrl()}/api/v1/auth/webauthn/credentials/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(false),
      credentials: "include",
    });

    if (!response.ok) {
      await handleWebAuthnResponse<void>(response);
    }
  },

  /**
   * Actualiza el nombre amigable de una Passkey.
   */
  async updateCredential(id: string, friendlyName: string): Promise<WebAuthnCredentialItem> {
    const url = `${getApiBaseUrl()}/api/v1/auth/webauthn/credentials/${id}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: getAuthHeaders(false),
      credentials: "include",
      body: JSON.stringify({ friendlyName }),
    });

    return handleWebAuthnResponse<WebAuthnCredentialItem>(response);
  },
};
