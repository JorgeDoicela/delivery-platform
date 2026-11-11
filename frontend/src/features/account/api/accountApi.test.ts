import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { accountApi } from "./accountApi";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import * as apiClientModule from "@/shared/lib/api-client";

describe("accountApi", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClientModule, "getApiBaseUrl").mockReturnValue("http://localhost:5005");
    vi.spyOn(apiClientModule, "getApiClientAccessToken").mockReturnValue("initial.token");
    vi.spyOn(apiClientModule, "getApiClientTenantSlug").mockReturnValue("la-granjita");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("getProfile realiza GET con cabeceras de autorización y slug", async () => {
    const mockProfile = {
      id: "u1",
      email: "test@example.com",
      fullName: "Test User",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProfile,
    });

    const result = await accountApi.getProfile();

    expect(result).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5005/api/v1/account/profile",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer initial.token",
          "X-Tenant-Slug": "la-granjita",
        }),
      })
    );
  });

  it("ante 401 Unauthorized, reintenta silenciosamente tras invocar checkAuth exitoso", async () => {
    const mockProfile = {
      id: "u1",
      email: "test@example.com",
      fullName: "Test User",
    };

    vi.spyOn(useAuthStore.getState(), "checkAuth").mockImplementation(async () => {
      // Simular que checkAuth actualizó el token
      vi.spyOn(apiClientModule, "getApiClientAccessToken").mockReturnValue("refreshed.token");
      return true;
    });

    // Primer intento devuelve 401, segundo intento devuelve 200 con el perfil
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Token expired" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      });

    const result = await accountApi.getProfile();

    expect(result).toEqual(mockProfile);
    expect(useAuthStore.getState().checkAuth).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Segundo llamado con el token refrescado
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:5005/api/v1/account/profile",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer refreshed.token",
        }),
      })
    );
  });

  it("ante 401 Unauthorized sin éxito de refresh, ejecuta logout y lanza excepción", async () => {
    vi.spyOn(useAuthStore.getState(), "checkAuth").mockResolvedValue(false);
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout").mockResolvedValue();

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized invalid refresh" }),
    });

    await expect(accountApi.getProfile()).rejects.toThrow("Unauthorized invalid refresh");
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});

