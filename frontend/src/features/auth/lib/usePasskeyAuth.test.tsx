import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePasskeyAuth } from "./usePasskeyAuth";
import * as simpleWebAuthn from "@simplewebauthn/browser";
import { webauthnApi } from "../api/webauthnApi";

vi.mock("@simplewebauthn/browser", () => ({
  browserSupportsWebAuthn: vi.fn(),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
  WebAuthnError: class WebAuthnError extends Error {
    code = "ERROR_TEST";
  },
}));

vi.mock("../api/webauthnApi", () => ({
  webauthnApi: {
    getRegistrationOptions: vi.fn(),
    completeRegistration: vi.fn(),
    getLoginOptions: vi.fn(),
    completeLogin: vi.fn(),
    getCredentials: vi.fn(),
    deleteCredential: vi.fn(),
    updateCredential: vi.fn(),
  },
}));

function HookTester({
  onHookReady,
}: {
  onHookReady: (hook: ReturnType<typeof usePasskeyAuth>) => void;
}) {
  const hook = usePasskeyAuth();
  React.useEffect(() => {
    onHookReady(hook);
  }, [hook, onHookReady]);
  return null;
}

describe("usePasskeyAuth", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("debe reportar si el navegador soporta WebAuthn", async () => {
    vi.mocked(simpleWebAuthn.browserSupportsWebAuthn).mockReturnValue(true);

    let currentHook: ReturnType<typeof usePasskeyAuth> | null = null;
    await act(async () => {
      root.render(
        <HookTester
          onHookReady={(h) => {
            currentHook = h;
          }}
        />
      );
    });

    expect(currentHook).not.toBeNull();
    expect(currentHook!.isSupported).toBe(true);
  });

  it("loginWithPasskey debe completar el flujo exitosamente", async () => {
    vi.mocked(simpleWebAuthn.browserSupportsWebAuthn).mockReturnValue(true);
    vi.mocked(webauthnApi.getLoginOptions).mockResolvedValueOnce({
      options: { challenge: "test-challenge", rpId: "localhost" } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      sessionId: "session-abc",
    });
    vi.mocked(simpleWebAuthn.startAuthentication).mockResolvedValueOnce({
      id: "cred-id",
      rawId: "raw-id",
      response: { clientDataJSON: "data", authenticatorData: "auth", signature: "sig" },
      type: "public-key",
      clientExtensionResults: {},
    });
    vi.mocked(webauthnApi.completeLogin).mockResolvedValueOnce({
      accessToken: "mock-jwt-token",
      user: {
        id: "user-1",
        email: "user@test.com",
        fullName: "User Test",
        role: "Customer",
        tenantId: null,
        branchId: null,
        isActive: true,
      },
      expiresAt: "2026-11-20T00:00:00Z",
    });

    let currentHook: ReturnType<typeof usePasskeyAuth> | null = null;
    await act(async () => {
      root.render(
        <HookTester
          onHookReady={(h) => {
            currentHook = h;
          }}
        />
      );
    });

    let success = false;
    await act(async () => {
      success = await currentHook!.loginWithPasskey("user@test.com", "la-granjita");
    });

    expect(success).toBe(true);
    expect(currentHook!.error).toBeNull();
  });

  it("loginWithPasskey debe manejar errores y exponer mensaje amigable", async () => {
    vi.mocked(simpleWebAuthn.browserSupportsWebAuthn).mockReturnValue(true);
    vi.mocked(webauthnApi.getLoginOptions).mockRejectedValueOnce(
      new Error("Sesión no encontrada")
    );

    let currentHook: ReturnType<typeof usePasskeyAuth> | null = null;
    await act(async () => {
      root.render(
        <HookTester
          onHookReady={(h) => {
            currentHook = h;
          }}
        />
      );
    });

    let success = true;
    await act(async () => {
      success = await currentHook!.loginWithPasskey();
    });

    expect(success).toBe(false);
    expect(currentHook!.error).toBe("Sesión no encontrada");
  });

  it("registerPasskey debe traducir mensajes técnicos en inglés como authenticator previously registered", async () => {
    vi.mocked(simpleWebAuthn.browserSupportsWebAuthn).mockReturnValue(true);
    vi.mocked(webauthnApi.getRegistrationOptions).mockResolvedValueOnce({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(simpleWebAuthn.startRegistration).mockResolvedValueOnce({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(webauthnApi.completeRegistration).mockRejectedValueOnce(
      new Error("The authenticator was previously registered")
    );

    let currentHook: ReturnType<typeof usePasskeyAuth> | null = null;
    await act(async () => {
      root.render(
        <HookTester
          onHookReady={(h) => {
            currentHook = h;
          }}
        />
      );
    });

    let cred = null;
    await act(async () => {
      cred = await currentHook!.registerPasskey("Mi equipo");
    });

    expect(cred).toBeNull();
    expect(currentHook!.error).toBe("Este dispositivo o huella ya se encuentra registrado en tu cuenta.");
  });
});
