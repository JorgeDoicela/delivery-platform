import React from "react";
import type { UpdateTenantStorefrontCommand } from "@/shared/types/api";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-surface-dark-card border border-surface-dark-border rounded-3xl p-6 space-y-4 text-xs">
        <h3 className="text-base font-black uppercase tracking-wide text-text-inverse-strong font-display border-b border-surface-dark-border pb-2">
          Datos de Marca y Textos de Landing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
              Nombre Comercial (Storefront)
            </label>
            <input
              type="text"
              required
              value={formState.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-bold focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
              Subtítulo / Tagline
            </label>
            <input
              type="text"
              required
              value={formState.tagline}
              onChange={(e) => onFieldChange("tagline", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
              Subtítulo de la Vitrina de Menú
            </label>
            <input
              type="text"
              value={formState.heroSubtitle}
              onChange={(e) => onFieldChange("heroSubtitle", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
              Descripción Institucional (Pie de Página y SEO)
            </label>
            <textarea
              rows={2}
              required
              value={formState.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
              Razón Social Legal (SRI)
            </label>
            <input
              type="text"
              value={formState.businessName}
              onChange={(e) => onFieldChange("businessName", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
              RUC / Identificación Tributaria
            </label>
            <input
              type="text"
              value={formState.taxId}
              onChange={(e) => onFieldChange("taxId", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-mono focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Panel de Paleta de Colores Dinámica */}
      <div className="bg-surface-dark-card border border-surface-dark-border rounded-3xl p-6 space-y-5 text-xs">
        <h3 className="text-base font-black uppercase tracking-wide text-text-inverse-strong font-display border-b border-surface-dark-border pb-2">
          Tokens de Color de Marca
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1.5">
              Color Primario (--brand-primary)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formState.brandPrimaryColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryColor", e.target.value)
                }
                className="w-11 h-10 rounded-xl bg-transparent border border-surface-dark-border cursor-pointer"
              />
              <input
                type="text"
                value={formState.brandPrimaryColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryColor", e.target.value)
                }
                className="flex-1 px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1.5">
              Color Hover (--brand-primary-hover)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formState.brandPrimaryHoverColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryHoverColor", e.target.value)
                }
                className="w-11 h-10 rounded-xl bg-transparent border border-surface-dark-border cursor-pointer"
              />
              <input
                type="text"
                value={formState.brandPrimaryHoverColor}
                onChange={(e) =>
                  onFieldChange("brandPrimaryHoverColor", e.target.value)
                }
                className="flex-1 px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1.5">
              Color Acento (--brand-accent)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formState.brandAccentColor}
                onChange={(e) =>
                  onFieldChange("brandAccentColor", e.target.value)
                }
                className="w-11 h-10 rounded-xl bg-transparent border border-surface-dark-border cursor-pointer"
              />
              <input
                type="text"
                value={formState.brandAccentColor}
                onChange={(e) =>
                  onFieldChange("brandAccentColor", e.target.value)
                }
                className="flex-1 px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-mono uppercase"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-surface-dark-border">
            <label className="flex items-center gap-2.5 cursor-pointer text-text-inverse-base">
              <input
                type="checkbox"
                checked={formState.quickLinksEnabled}
                onChange={(e) =>
                  onFieldChange("quickLinksEnabled", e.target.checked)
                }
                className="rounded border-surface-dark-border"
              />
              <span>Mostrar panel de accesos rápidos en la landing</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

