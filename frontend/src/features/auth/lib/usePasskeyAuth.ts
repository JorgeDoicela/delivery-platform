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

export function translateWebAuthnError(rawError: string | Error | unknown): string {
  let msg = "";
  if (typeof rawError === "string") {
    msg = rawError;
  } else if (rawError instanceof Error) {
    msg = rawError.message;
  } else if (rawError && typeof rawError === "object" && "message" in rawError) {
    msg = String((rawError as { message: unknown }).message);
  }

  const lower = msg.toLowerCase();

  if (
    lower.includes("previously registered") ||
    lower.includes("already registered") ||
    lower.includes("invalidstateerror") ||
    lower.includes("passkeyalreadyregistered")
  ) {
    return "Este dispositivo o huella ya se encuentra registrado en tu cuenta.";
  }

  if (
    lower.includes("notallowederror") ||
    lower.includes("cancelled") ||
    lower.includes("cancelado") ||
    lower.includes("the operation either timed out or was not allowed")
  ) {
    return "Se canceló la verificación o no hay una huella guardada en este equipo.";
  }

  if (lower.includes("aborterror") || lower.includes("timed out") || lower.includes("timeout")) {
    return "Se agotó el tiempo de espera. Inténtalo de nuevo.";
  }

  if (lower.includes("notsupportederror") || lower.includes("not supported")) {
    return "Este navegador o dispositivo no permite entrar con huella o rostro.";
  }

  if (lower.includes("securityerror")) {
    return "El navegador no permitió usar la biometría en esta página.";
  }

  if (lower.includes("challenge") || lower.includes("expir")) {
    return "La verificación expiró. Inténtalo de nuevo.";
  }

  return msg || "No se pudo completar la verificación. Inténtalo de nuevo.";
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
                "No tienes una huella o rostro guardado en este equipo. Entra con WhatsApp, Google o tu correo y actívalo en tu perfil."
              );
              return false;
            }
          }
          setError(translateWebAuthnError(err));
        } else {
          setError(translateWebAuthnError(err));
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
              setError("Cancelaste el registro de tu huella o rostro.");
              return null;
            }
          }
          setError(translateWebAuthnError(err));
        } else {
          setError(translateWebAuthnError(err));
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
