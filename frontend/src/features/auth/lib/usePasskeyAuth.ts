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
        setError("Tu dispositivo o navegador actual no permite ingresar con huella o rostro.");
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
              setError(
                "No se encontró una huella o rostro registrada en este equipo o se canceló el intento. Si aún no tienes cuenta, crea una gratis; o ingresa con tu correo y contraseña para activarla."
              );
              return false;
            }
          }
          setError(err.message || "No se pudo verificar tu huella o rostro.");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("No pudimos iniciar sesión en este momento.");
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
        setError("Tu navegador no permite activar el acceso con huella o rostro.");
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
              setError("Activación cancelada en tu dispositivo.");
              return null;
            }
          }
          setError(err.message || "No se pudo activar el acceso en este equipo.");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("No se pudo completar la activación en este equipo.");
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
