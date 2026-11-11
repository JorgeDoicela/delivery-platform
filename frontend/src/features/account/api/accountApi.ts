import {
  ApiClientError,
  getApiBaseUrl,
  getApiClientAccessToken,
  getApiClientTenantSlug,
} from "@/shared/lib/api-client";
import { isJwtExpired } from "@/shared/lib/jwt";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type {
  AccountProfile,
  AccountAddress,
  GetMyOrdersResponse,
  UpdateProfilePayload,
  UpsertAddressPayload,
  ChangePasswordPayload,
  UpdateConsentPayload,
} from "../types";

function buildHeaders(extra?: HeadersInit, isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const slug = getApiClientTenantSlug();
  if (slug) {
    headers["X-Tenant-Slug"] = slug;
  }

  const token = getApiClientAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return { ...headers, ...extra };
}

async function fetchAccountWithAuth(
  endpoint: string,
  init?: RequestInit,
  isFormData = false
): Promise<Response> {
  const url = `${getApiBaseUrl()}${endpoint}`;

  // 1. Si el token actual está expirado, refrescar proactivamente antes de enviar la petición
  const token = getApiClientAccessToken();
  if (token && isJwtExpired(token)) {
    try {
      await useAuthStore.getState().checkAuth();
    } catch {
      // Continuar y permitir que la petición proceda o capture el 401
    }
  }

  // 2. Ejecutar petición inicial
  let res = await fetch(url, {
    ...init,
    headers: buildHeaders(init?.headers, isFormData),
    credentials: "include",
  });

  // 3. Si el servidor retorna 401 Unauthorized, reintentar silenciosamente tras refrescar la sesión
  if (res.status === 401) {
    const refreshed = await useAuthStore.getState().checkAuth();
    if (refreshed) {
      res = await fetch(url, {
        ...init,
        headers: buildHeaders(init?.headers, isFormData),
        credentials: "include",
      });
    } else {
      await useAuthStore.getState().logout();
    }
  }

  return res;
}

async function handleAccountResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Ocurrió un error inesperado al procesar la solicitud.";
    let code = `HTTP_${res.status}`;

    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
      else if (data.message) message = data.message;
      else if (data.title) message = data.title;

      if (data.code) code = data.code;
      else if (data.status) code = `HTTP_${data.status}`;
    } catch {
      // Ignorar fallo de parseo JSON
    }

    throw new ApiClientError(message, code, res.status);
  }

  // Si no hay contenido (ej: 204 No Content o boolean)
  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export const accountApi = {
  async getProfile(): Promise<AccountProfile> {
    const res = await fetchAccountWithAuth("/api/v1/account/profile", {
      method: "GET",
    });
    return handleAccountResponse<AccountProfile>(res);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AccountProfile> {
    const res = await fetchAccountWithAuth("/api/v1/account/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return handleAccountResponse<AccountProfile>(res);
  },

  async getMyOrders(params?: { page?: number; pageSize?: number; status?: string }): Promise<GetMyOrdersResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.pageSize) query.set("pageSize", params.pageSize.toString());
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    const endpoint = `/api/v1/account/orders${qs ? `?${qs}` : ""}`;
    const res = await fetchAccountWithAuth(endpoint, {
      method: "GET",
    });
    return handleAccountResponse<GetMyOrdersResponse>(res);
  },

  async getAddresses(): Promise<AccountAddress[]> {
    const res = await fetchAccountWithAuth("/api/v1/account/addresses", {
      method: "GET",
    });
    return handleAccountResponse<AccountAddress[]>(res);
  },

  async upsertAddress(payload: UpsertAddressPayload): Promise<AccountAddress> {
    const res = await fetchAccountWithAuth("/api/v1/account/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleAccountResponse<AccountAddress>(res);
  },

  async deleteAddress(id: string): Promise<boolean> {
    const res = await fetchAccountWithAuth(`/api/v1/account/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await handleAccountResponse<unknown>(res);
    return true;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<boolean> {
    const res = await fetchAccountWithAuth("/api/v1/account/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleAccountResponse<boolean>(res);
  },

  async updateConsent(payload: UpdateConsentPayload): Promise<boolean> {
    const res = await fetchAccountWithAuth("/api/v1/account/privacy", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return handleAccountResponse<boolean>(res);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetchAccountWithAuth(
      "/api/v1/account/avatar",
      {
        method: "POST",
        body: formData,
      },
      true
    );
    return handleAccountResponse<{ avatarUrl: string }>(res);
  },

  async deleteAvatar(): Promise<boolean> {
    const res = await fetchAccountWithAuth("/api/v1/account/avatar", {
      method: "DELETE",
    });
    await handleAccountResponse<unknown>(res);
    return true;
  },
};

