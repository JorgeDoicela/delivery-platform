"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Fingerprint,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { webauthnApi, type WebAuthnCredentialItem } from "@/features/auth/api/webauthnApi";
import { usePasskeyAuth } from "@/features/auth/lib/usePasskeyAuth";
import { useCurrentTenantQuery } from "@/features/tenant";
import { AlertBanner } from "@/shared/components";

export function PasskeySettingsSection() {
  const { data: tenant } = useCurrentTenantQuery();
  const { isSupported, isLoading: isRegistering, registerPasskey, error: passkeyError } = usePasskeyAuth();

  const [credentials, setCredentials] = useState<WebAuthnCredentialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados de edición de nombre
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Estado de eliminación
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reloadCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await webauthnApi.getCredentials();
      setCredentials(data);
    } catch {
      setCredentials([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    webauthnApi
      .getCredentials()
      .then((data) => {
        if (isMounted) {
          setCredentials(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCredentials([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRegisterNewPasskey = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const friendlyName = `Mi dispositivo (${new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })})`;

    const newCred = await registerPasskey(friendlyName, tenant?.slug);
    if (newCred) {
      setSuccessMessage("Dispositivo activado con éxito. Ahora puedes entrar directamente con tu huella o rostro.");
      reloadCredentials();
    }
  };

  const handleStartEdit = (cred: WebAuthnCredentialItem) => {
    setEditingId(cred.id);
    setEditingName(cred.friendlyName);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      setIsUpdating(true);
      setErrorMessage(null);
      await webauthnApi.updateCredential(id, editingName.trim());
      setSuccessMessage("Nombre del dispositivo actualizado.");
      setEditingId(null);
      reloadCredentials();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al actualizar el nombre del dispositivo.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setErrorMessage(null);
      await webauthnApi.deleteCredential(id);
      setSuccessMessage("Dispositivo desactivado correctamente.");
      reloadCredentials();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al desactivar el dispositivo.");
    } finally {
      setDeletingId(null);
    }
  };

  const activeError = passkeyError || errorMessage;

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-black text-text-strong font-display uppercase tracking-tight">
              Acceso Rápido con Huella o Rostro
            </h2>
          </div>
          <p className="text-xs text-text-muted mt-1 max-w-xl">
            Entra a tu cuenta en un segundo usando la huella o el reconocimiento facial de tu celular o computadora, sin tener que escribir tu contraseña.
          </p>
        </div>

        {isSupported && (
          <button
            type="button"
            onClick={handleRegisterNewPasskey}
            disabled={isRegistering}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-bold text-xs uppercase tracking-wider font-display px-5 py-2.5 rounded-full shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Activando...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Activar en este equipo</span>
              </>
            )}
          </button>
        )}
      </div>

      {!isSupported && (
        <AlertBanner variant="warning" title="Función no disponible en este navegador">
          Tu navegador actual no permite entrar con huella o rostro. Puedes usar esta función abriendo la página desde Safari, Google Chrome o Microsoft Edge.
        </AlertBanner>
      )}

      {successMessage && (
        <AlertBanner
          variant="success"
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </AlertBanner>
      )}

      {activeError && (
        <AlertBanner
          variant="error"
          onClose={() => {
            setErrorMessage(null);
          }}
        >
          {activeError}
        </AlertBanner>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-8 px-4 border border-dashed border-surface-border rounded-2xl bg-surface-canvas/50 space-y-2">
          <KeyRound className="w-8 h-8 text-text-subtle mx-auto stroke-[1.5]" />
          <p className="text-xs font-bold text-text-strong font-display uppercase tracking-wide">
            No tienes dispositivos activados todavía
          </p>
          <p className="text-[11px] text-text-muted max-w-sm mx-auto">
            Activa tu teléfono o computadora actual para entrar a tu cuenta de forma más rápida y segura.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-surface-border">
          {credentials.map((cred) => {
            const isEditing = editingId === cred.id;
            const isDeleting = deletingId === cred.id;

            return (
              <div
                key={cred.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-surface-canvas border border-surface-border flex items-center justify-center shrink-0 text-brand-primary">
                    <Fingerprint className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={isUpdating}
                          className="px-2.5 py-1 text-xs rounded-lg border border-surface-border bg-surface-canvas text-text-strong focus:outline-none focus:border-brand-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cred.id)}
                          disabled={isUpdating}
                          aria-label="Guardar nombre"
                          className="p-1 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          aria-label="Cancelar"
                          className="p-1 text-text-subtle hover:text-text-strong cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-strong truncate">
                          {cred.friendlyName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cred)}
                          aria-label="Editar nombre de llave"
                          className="p-1 text-text-subtle hover:text-text-strong rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 stroke-[2]" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                      <span>
                        Creada:{" "}
                        {new Date(cred.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {cred.lastUsedAt && (
                        <>
                          <span>•</span>
                          <span>
                            Último uso:{" "}
                            {new Date(cred.lastUsedAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(cred.id)}
                    disabled={isDeleting}
                    aria-label={`Desactivar ${cred.friendlyName}`}
                    className="p-2 text-text-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
