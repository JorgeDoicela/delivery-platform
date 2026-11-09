import {
  ApiClientError,
  getApiClientTenantSlug,
  getApiBaseUrl,
} from "@/shared/lib/api-client";
import type {
  AuthUser,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
} from "../types";
import type { LoginFormData } from "../schemas/loginSchema";


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
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ ...credentials, tenantSlug }),
    });
    return handleAuthResponse<LoginResponse>(res);
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ ...data, tenantSlug: data.tenantSlug || tenantSlug }),
    });
    return handleAuthResponse<RegisterResponse>(res);
  },

  async loginWithGoogle(data: GoogleAuthRequest): Promise<GoogleAuthResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ ...data, tenantSlug: data.tenantSlug || tenantSlug }),
    });
    return handleAuthResponse<GoogleAuthResponse>(res);
  },

  async refresh(): Promise<RefreshTokenResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({}),
    });
    return handleAuthResponse<RefreshTokenResponse>(res);
  },

  async getCurrentUser(accessToken?: string | null): Promise<AuthUser> {
    const tenantSlug = getApiClientTenantSlug();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      method: "GET",
      headers,
      credentials: "include",
    });
    return handleAuthResponse<AuthUser>(res);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ ...data, tenantSlug: data.tenantSlug || tenantSlug }),
    });
    return handleAuthResponse<ForgotPasswordResponse>(res);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ ...data, tenantSlug: data.tenantSlug || tenantSlug }),
    });
    return handleAuthResponse<ResetPasswordResponse>(res);
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleAuthResponse<VerifyEmailResponse>(res);
  },

  async resendVerification(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    const tenantSlug = getApiClientTenantSlug();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ ...data, tenantSlug: data.tenantSlug || tenantSlug }),
    });
    return handleAuthResponse<ResendVerificationResponse>(res);
  },

  async logout(): Promise<void> {
    const tenantSlug = getApiClientTenantSlug();
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
      credentials: "include",
      body: JSON.stringify({}),
    });
  },
};

