import { describe, it, expect, vi, beforeEach } from "vitest";
import { webauthnApi } from "./webauthnApi";

describe("webauthnApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getRegistrationOptions debe invocar /api/v1/auth/webauthn/register/options con método POST", async () => {
    const mockOptions = {
      challenge: "mock-challenge",
      rp: { name: "Mesafy", id: "localhost" },
      user: { id: "user-id", name: "test@domain.com", displayName: "Test User" },
      pubKeyCredParams: [],
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockOptions,
    } as Response);

    const result = await webauthnApi.getRegistrationOptions("la-granjita");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/webauthn/register/options"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
    expect(result).toEqual(mockOptions);
  });

  it("getLoginOptions debe invocar /api/v1/auth/webauthn/login/options", async () => {
    const mockResponse = {
      options: {
        challenge: "login-challenge",
        rpId: "localhost",
      },
      sessionId: "session-12345",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await webauthnApi.getLoginOptions("cliente@mesafy.com", "la-granjita");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/webauthn/login/options"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "cliente@mesafy.com", tenantSlug: "la-granjita" }),
      })
    );
    expect(result.sessionId).toBe("session-12345");
  });

  it("getCredentials debe invocar /api/v1/auth/webauthn/credentials con método GET", async () => {
    const mockCredentials = [
      {
        id: "cred-1",
        friendlyName: "Touch ID",
        authenticatorType: "platform",
        attestationFormat: "none",
        createdAt: "2026-11-19T00:00:00Z",
        signCount: 1,
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredentials,
    } as Response);

    const result = await webauthnApi.getCredentials();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/webauthn/credentials"),
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].friendlyName).toBe("Touch ID");
  });

  it("deleteCredential debe enviar DELETE al endpoint específico", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as unknown as Response);

    await webauthnApi.deleteCredential("cred-to-delete");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/webauthn/credentials/cred-to-delete"),
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });
});
