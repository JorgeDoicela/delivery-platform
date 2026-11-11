import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Select, type SelectOption } from "@/shared/components/Select";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";
import type { UpdateTenantStorefrontCommand } from "@/shared/types/api";

const LANDING_LAYOUT_OPTIONS: SelectOption[] = [
  {
    value: "asadero-clasico",
    label: "Asadero Clásico (Slider Panorámico + Combos Asador)",
  },
  {
    value: "steakhouse-gourmet",
    label: "Steakhouse Gourmet (Cortes Angus + Cámara de Maduración)",
  },
  {
    value: "fast-casual-urbano",
    label: "Fast-Casual Urbano (Hero Dividido + Vitrina Moderna)",
  },
];

interface StorefrontBrandingSectionProps {
  formState: UpdateTenantStorefrontCommand;
  onFieldChange: <K extends keyof UpdateTenantStorefrontCommand>(
    key: K,
    value: UpdateTenantStorefrontCommand[K]
  ) => void;
}

export function StorefrontBrandingSection({
  formState,
  onFieldChange,
}: StorefrontBrandingSectionProps) {
  const currentTenantSlug = useTenantStore((s) => s.tenantSlug) || "la-granjita";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("tenantSlug", currentTenantSlug);
      data.append("category", "identidad");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir el logo.");
      }

      const result = await response.json();
      onFieldChange("logoUrl", result.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir el logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl bg-surface-canvas border border-surface-border text-text-strong focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-colors placeholder:text-text-muted";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-3xl p-6 space-y-4 text-xs shadow-xs transition-colors duration-200">
        <h3 className="text-base font-black uppercase tracking-wide text-text-strong font-display border-b border-surface-border pb-2">
          Datos de Marca y Textos de Landing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Nombre Comercial (Storefront)
            </label>
            <input
              type="text"
              required
              value={formState.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              className={`${inputClass} font-bold`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Subtítulo / Tagline
            </label>
            <input
              type="text"
              required
              value={formState.tagline}
              onChange={(e) => onFieldChange("tagline", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Subtítulo de la Vitrina de Menú
            </label>
            <input
              type="text"
              value={formState.heroSubtitle}
              onChange={(e) => onFieldChange("heroSubtitle", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Descripción Institucional (Pie de Página y SEO)
            </label>
            <textarea
              rows={2}
              required
              value={formState.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Razón Social Legal (SRI)
            </label>
            <input
              type="text"
              value={formState.businessName}
              onChange={(e) => onFieldChange("businessName", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              RUC / Identificación Tributaria
            </label>
            <input
              type="text"
              value={formState.taxId}
              onChange={(e) => onFieldChange("taxId", e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Dominio Propio Personalizado (Opcional)
            </label>
            <input
              type="text"
              value={formState.customDomain || ""}
              onChange={(e) => onFieldChange("customDomain", e.target.value || null)}
              placeholder="pedidos.mirestaurante.com o elbrasero.com"
              className={`${inputClass} font-mono text-xs`}
            />
            <p className="text-[11px] text-text-muted mt-1">
              Permite que tus clientes ingresen directo a tu tienda desde tu propio dominio mediante un registro CNAME en tu DNS.
            </p>
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-surface-border">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              URL o Ruta del Logotipo de Marca (PNG / SVG / WebP)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formState.logoUrl || "/images/shared/placeholders/logo-default.png"}
                  alt="Previsualización Logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formState.logoUrl || ""}
                    onChange={(e) => onFieldChange("logoUrl", e.target.value)}
                    placeholder="/images/shared/placeholders/logo-default.png"
                    className={`${inputClass} font-mono text-xs flex-1`}
                  />

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-canvas hover:bg-surface-card-hover text-text-strong font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-brand-primary" />
                    )}
                    <span>Subir Logotipo Local</span>
                  </button>
                </div>
                {uploadError && (
                  <p className="text-[11px] text-red-500 font-semibold">{uploadError}</p>
                )}
                <p className="text-[11px] text-text-muted">
                  Puedes ingresar cualquier URL externa (HTTPS) o una ruta local dentro de <code className="text-brand-accent">/images/</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Paleta de Colores Dinámica */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-5 text-xs shadow-xs transition-colors duration-200">
        <h3 className="text-base font-black uppercase tracking-wide text-text-strong font-display border-b border-surface-border pb-2">
          Tokens de Color de Marca
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Color Primario (--brand-primary)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formState.brandPrimaryColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryColor", e.target.value)
                }
                className="w-11 h-10 rounded-xl bg-transparent border border-surface-border cursor-pointer"
              />
              <input
                type="text"
                value={formState.brandPrimaryColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryColor", e.target.value)
                }
                className="flex-1 px-3 py-2 rounded-xl bg-surface-canvas border border-surface-border text-text-strong font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Color Hover (--brand-primary-hover)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formState.brandPrimaryHoverColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryHoverColor", e.target.value)
                }
                className="w-11 h-10 rounded-xl bg-transparent border border-surface-border cursor-pointer"
              />
              <input
                type="text"
                value={formState.brandPrimaryHoverColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryHoverColor", e.target.value)
                }
                className="flex-1 px-3 py-2 rounded-xl bg-surface-canvas border border-surface-border text-text-strong font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Color Acento (--brand-accent)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formState.brandAccentColor}
                onChange={(e) =>
                  onFieldChange("brandAccentColor", e.target.value)
                }
                className="w-11 h-10 rounded-xl bg-transparent border border-surface-border cursor-pointer"
              />
              <input
                type="text"
                value={formState.brandAccentColor}
                onChange={(e) =>
                  onFieldChange("brandAccentColor", e.target.value)
                }
                className="flex-1 px-3 py-2 rounded-xl bg-surface-canvas border border-surface-border text-text-strong font-mono uppercase"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border space-y-3">
            <div>
              <Select
                label="Plantilla de Estructura de Landing"
                options={LANDING_LAYOUT_OPTIONS}
                value={formState.landingLayoutTemplate ?? "asadero-clasico"}
                onChange={(val) =>
                  onFieldChange("landingLayoutTemplate", val)
                }
                size="sm"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-text-base">
              <input
                type="checkbox"
                checked={formState.quickLinksEnabled}
                onChange={(e) =>
                  onFieldChange("quickLinksEnabled", e.target.checked)
                }
                className="rounded border-surface-border"
              />
              <span>Mostrar panel de accesos rápidos en la landing</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
