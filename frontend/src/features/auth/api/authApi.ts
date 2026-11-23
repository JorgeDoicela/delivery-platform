import {
  ApiClientError,
  getApiClientTenantSlug,
  getApiClientTenantDomain,
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
  RequestWhatsAppOtpRequest,
  RequestWhatsAppOtpResponse,
  VerifyWhatsAppOtpRequest,
  VerifyWhatsAppOtpResponse,
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

function buildAuthHeaders(
  extraHeaders?: Record<string, string>,
  tenantSlugOverride?: string
): Record<string, string> {
  const slug = tenantSlugOverride || getApiClientTenantSlug();
  const domain = getApiClientTenantDomain();

  return {
    "Content-Type": "application/json",
    ...(slug ? { "X-Tenant-Slug": slug } : {}),
    ...(domain ? { "X-Tenant-Domain": domain } : {}),
    ...extraHeaders,
  };
}

let inFlightRefreshPromise: Promise<RefreshTokenResponse> | null = null;

export const authApi = {
  async login(credentials: LoginFormData & { tenantSlug?: string }): Promise<LoginResponse> {
    const tenantSlug = credentials.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      credentials: "include",
      body: JSON.stringify({ ...credentials, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<LoginResponse>(res);
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const tenantSlug = data.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      credentials: "include",
      body: JSON.stringify({ ...data, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<RegisterResponse>(res);
  },

  async loginWithGoogle(data: GoogleAuthRequest): Promise<GoogleAuthResponse> {
    const tenantSlug = data.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/google`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      credentials: "include",
      body: JSON.stringify({ ...data, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<GoogleAuthResponse>(res);
  },

  async refresh(): Promise<RefreshTokenResponse> {
    if (inFlightRefreshPromise) {
      return inFlightRefreshPromise;
    }

    inFlightRefreshPromise = (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
          method: "POST",
          headers: buildAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({}),
        });
        return await handleAuthResponse<RefreshTokenResponse>(res);
      } finally {
        inFlightRefreshPromise = null;
      }
    })();

    return inFlightRefreshPromise;
  },

  async getCurrentUser(accessToken?: string | null): Promise<AuthUser> {
    const extraHeaders: Record<string, string> = {};
    if (accessToken) {
      extraHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      method: "GET",
      headers: buildAuthHeaders(extraHeaders),
      credentials: "include",
    });
    return handleAuthResponse<AuthUser>(res);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const tenantSlug = data.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      credentials: "include",
      body: JSON.stringify({ ...data, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<ForgotPasswordResponse>(res);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const tenantSlug = data.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      credentials: "include",
      body: JSON.stringify({ ...data, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<ResetPasswordResponse>(res);
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: buildAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleAuthResponse<VerifyEmailResponse>(res);
  },

  async resendVerification(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    const tenantSlug = data.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/resend-verification`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      credentials: "include",
      body: JSON.stringify({ ...data, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<ResendVerificationResponse>(res);
  },

  async requestWhatsAppOtp(data: RequestWhatsAppOtpRequest): Promise<RequestWhatsAppOtpResponse> {
    const tenantSlug = data.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/whatsapp/otp/request`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      body: JSON.stringify({ ...data, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<RequestWhatsAppOtpResponse>(res);
  },

  async verifyWhatsAppOtp(data: VerifyWhatsAppOtpRequest): Promise<VerifyWhatsAppOtpResponse> {
    const tenantSlug = data.tenantSlug || getApiClientTenantSlug() || undefined;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/whatsapp/otp/verify`, {
      method: "POST",
      headers: buildAuthHeaders(undefined, tenantSlug),
      credentials: "include",
      body: JSON.stringify({ ...data, ...(tenantSlug ? { tenantSlug } : {}) }),
    });
    return handleAuthResponse<VerifyWhatsAppOtpResponse>(res);
  },

  async logout(): Promise<void> {
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      headers: buildAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({}),
    });
  },
};

