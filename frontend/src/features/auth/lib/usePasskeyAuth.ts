"use client";

import { useState, useCallback } from "react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";
import { webauthnApi, type WebAuthnCredentialItem } from "../api/webauthnApi";
import { useAuthStore } from "../store/useAuthStore";
import { setApiClientAccessToken } from "@/shared/lib/tenant-context";

interface UsePasskeyAuthReturn {
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  loginWithPasskey: (email?: string, tenantSlug?: string) => Promise<boolean>;
  registerPasskey: (friendlyName?: string, tenantSlug?: string) => Promise<WebAuthnCredentialItem | null>;
}

export function usePasskeyAuth(): UsePasskeyAuthReturn {
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return browserSupportsWebAuthn();
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loginWithPasskey = useCallback(
    async (email?: string, tenantSlug?: string): Promise<boolean> => {
      if (!browserSupportsWebAuthn()) {
        setError("Tu navegador o dispositivo no soporta autenticación biométrica (Passkeys / FIDO2).");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Obtener opciones y sessionId del backend
        const { options, sessionId } = await webauthnApi.getLoginOptions(email, tenantSlug);

        // 2. Invocar la ceremonia nativa del navegador / dispositivo (TouchID, FaceID, Windows Hello, YubiKey)
        const assertion = await startAuthentication({ optionsJSON: options });

        // 3. Completar el login en el backend y recibir JWT
        const response = await webauthnApi.completeLogin(sessionId, assertion, tenantSlug);

        // 4. Guardar sesión en el AuthStore
        setApiClientAccessToken(response.accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("delivery_has_session", "1");
        }

        useAuthStore.getState().setAccessToken(response.accessToken);
        useAuthStore.getState().setUser(response.user);

        return true;
      } catch (err: unknown) {
        if (err instanceof WebAuthnError) {
          if (err.code === "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY") {
            const cause = err.cause as { name?: string };
            if (cause?.name === "NotAllowedError") {
              // Operación cancelada por el usuario en el diálogo biométrico
              setError("Inicio de sesión biométrico cancelado.");
              return false;
            }
          }
          setError(err.message || "Error en la verificación biométrica.");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("No se pudo completar el inicio de sesión con llave de acceso.");
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const registerPasskey = useCallback(
    async (friendlyName?: string, tenantSlug?: string): Promise<WebAuthnCredentialItem | null> => {
      if (!browserSupportsWebAuthn()) {
        setError("Tu navegador no soporta el registro de llaves de acceso (Passkeys).");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Obtener opciones de creación de credencial
        const options = await webauthnApi.getRegistrationOptions(tenantSlug);

        // 2. Invocar el diálogo nativo del sistema operativo para registrar el authenticator
        const attestation = await startRegistration({ optionsJSON: options });

        // 3. Verificar y persistir la llave de acceso en el backend
        const credential = await webauthnApi.completeRegistration(attestation, friendlyName, tenantSlug);

        return credential;
      } catch (err: unknown) {
        if (err instanceof WebAuthnError) {
          if (err.code === "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY") {
            const cause = err.cause as { name?: string };
            if (cause?.name === "NotAllowedError") {
              setError("Registro biométrico cancelado por el usuario.");
              return null;
            }
          }
          setError(err.message || "Error al registrar la llave de acceso.");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("No se pudo completar el registro de la llave de acceso.");
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isSupported,
    isLoading,
    error,
    clearError,
    loginWithPasskey,
    registerPasskey,
  };
}
