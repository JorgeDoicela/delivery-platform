"use client";

import { useRef, useState } from "react";
import { ShieldCheck, Mail, Phone, Camera, Trash2, Loader2, AlertCircle } from "lucide-react";
import { getApiBaseUrl } from "@/shared/lib/api-client";
import { useAccountStore } from "../store/useAccountStore";
import type { AccountProfile } from "../types";

interface AccountHeaderProps {
  profile: AccountProfile | null;
  isLoading: boolean;
}

export function resolveAvatarUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${getApiBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

export function AccountHeader({ profile, isLoading }: AccountHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useAccountStore((s) => s.uploadAvatar);
  const deleteAvatar = useAccountStore((s) => s.deleteAvatar);
  const isUploadingAvatar = useAccountStore((s) => s.isUploadingAvatar);
  const avatarError = useAccountStore((s) => s.avatarError);

  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleTriggerUpload = () => {
    setPreviewError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación estricta en cliente: solo imágenes
    if (!file.type.startsWith("image/")) {
      setPreviewError("Solo se permiten archivos de imagen (JPG, PNG o WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPreviewError("La imagen seleccionada supera el límite máximo de 5 MB.");
      return;
    }

    await uploadAvatar(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Deseas eliminar tu foto de perfil actual?")) {
      await deleteAvatar();
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 md:p-8 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-canvas" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-surface-canvas rounded-lg" />
            <div className="h-4 w-64 bg-surface-canvas/60 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "CL";

  const resolvedAvatar = resolveAvatarUrl(profile.avatarUrl);

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-6 md:p-8 shadow-xs space-y-4">
      <div className="flex items-center gap-4 min-w-0">
        {/* Contenedor de Avatar Interactivo con botón de cámara */}
        <div className="relative group shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-canvas text-text-strong font-black text-xl sm:text-2xl flex items-center justify-center font-display tracking-wider overflow-hidden shadow-sm border border-surface-border">
            {isUploadingAvatar ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-surface-canvas/90 text-text-strong gap-1">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              </div>
            ) : resolvedAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={resolvedAvatar}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Botón flotante para seleccionar foto */}
          <button
            type="button"
            onClick={handleTriggerUpload}
            disabled={isUploadingAvatar}
            title="Cambiar foto de perfil"
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-primary hover:brightness-110 text-white shadow-md border-2 border-surface-card transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {/* Botón para eliminar foto si ya existe */}
          {resolvedAvatar && !isUploadingAvatar && (
            <button
              type="button"
              onClick={handleDeleteAvatar}
              title="Eliminar foto de perfil"
              className="absolute -top-1 -right-1 p-1.5 rounded-full bg-surface-card hover:bg-red-50 dark:hover:bg-red-950/40 text-text-muted hover:text-red-500 shadow-sm border border-surface-border transition-all active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-text-strong font-display uppercase tracking-tight break-words">
              {profile.fullName || "Cliente de la Plataforma"}
            </h1>
            {profile.isEmailVerified && (
              <span
                title="Cuenta de correo verificada"
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text-strong bg-surface-canvas border border-surface-border px-2 py-0.5 rounded-full shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                <span>Verificada</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-muted break-all sm:break-normal">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-text-subtle shrink-0" />
              <span>{profile.email}</span>
            </span>
            {profile.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                <span>{profile.phone}</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-subtle mt-1">
            Haz clic en la cámara para actualizar tu foto de perfil.
          </p>
        </div>
      </div>

      {/* Alertas de error de subida si ocurren */}
      {(previewError || avatarError) && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-brand-primary shrink-0" />
          <span>{previewError || avatarError}</span>
        </div>
      )}
    </div>
  );
}
