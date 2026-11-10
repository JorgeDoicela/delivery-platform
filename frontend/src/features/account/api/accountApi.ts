import {
  ApiClientError,
  getApiBaseUrl,
  getApiClientAccessToken,
  getApiClientTenantSlug,
} from "@/shared/lib/api-client";
import type {
  AccountProfile,
  AccountAddress,
  GetMyOrdersResponse,
  UpdateProfilePayload,
  UpsertAddressPayload,
  ChangePasswordPayload,
  UpdateConsentPayload,
} from "../types";

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

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
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/profile`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    return handleAccountResponse<AccountProfile>(res);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AccountProfile> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/profile`, {
      method: "PUT",
      headers: buildHeaders(),
      credentials: "include",
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
    const url = `${getApiEndOrdersUrl()}${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    return handleAccountResponse<GetMyOrdersResponse>(res);
  },

  async getAddresses(): Promise<AccountAddress[]> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/addresses`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    return handleAccountResponse<AccountAddress[]>(res);
  },

  async upsertAddress(payload: UpsertAddressPayload): Promise<AccountAddress> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/addresses`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return handleAccountResponse<AccountAddress>(res);
  },

  async deleteAddress(id: string): Promise<boolean> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: buildHeaders(),
      credentials: "include",
    });
    await handleAccountResponse<unknown>(res);
    return true;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<boolean> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/change-password`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return handleAccountResponse<boolean>(res);
  },

  async updateConsent(payload: UpdateConsentPayload): Promise<boolean> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/privacy`, {
      method: "PUT",
      headers: buildHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return handleAccountResponse<boolean>(res);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const token = getApiClientAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const slug = getApiClientTenantSlug();
    if (slug) {
      headers["X-Tenant-Slug"] = slug;
    }

    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/avatar`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    return handleAccountResponse<{ avatarUrl: string }>(res);
  },

  async deleteAvatar(): Promise<boolean> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/account/avatar`, {
      method: "DELETE",
      headers: buildHeaders(),
      credentials: "include",
    });
    await handleAccountResponse<unknown>(res);
    return true;
  },
};

function getApiEndOrdersUrl(): string {
  return `${getApiBaseUrl()}/api/v1/account/orders`;
}

