import {
  ApiClientError,
  getApiClientTenantSlug,
} from "@/shared/lib/api-client";
import type {
  AuthUser,
  LoginResponse,
  RefreshTokenResponse,
} from "../types";
import type { LoginFormData } from "../schemas/loginSchema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

async function handleAuthResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Error en el servidor de autenticación.";
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
      } else if (json.status) {
        code = `HTTP_${json.status}`;
      }
    } catch {
      // Fallback a mensaje estándar en respuestas no-JSON
    }

    throw new ApiClientError(message, code, response.status);
  }

  return response.json();
}

export const authApi = {
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
      },
      credentials: "include",
      body: JSON.stringify({ ...credentials, tenantSlug }),
    });
    return handleAuthResponse<LoginResponse>(res);
  },

  async refresh(): Promise<RefreshTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": getApiClientTenantSlug(),
      },
      credentials: "include",
      body: JSON.stringify({}),
    });
    return handleAuthResponse<RefreshTokenResponse>(res);
  },

  async getCurrentUser(accessToken?: string | null): Promise<AuthUser> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-Slug": getApiClientTenantSlug(),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers,
      credentials: "include",
    });
    return handleAuthResponse<AuthUser>(res);
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": getApiClientTenantSlug(),
      },
      credentials: "include",
      body: JSON.stringify({}),
    });
  },
};

