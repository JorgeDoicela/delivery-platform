"use client";

import React from "react";
import type { TenantPromoBanner } from "@/shared/types/api";
import { Plus, Trash2 } from "lucide-react";

interface PromoBannersEditorProps {
  banners: TenantPromoBanner[];
  onChange: (banners: TenantPromoBanner[]) => void;
}

export function PromoBannersEditor({
  banners,
  onChange,
}: PromoBannersEditorProps) {
  const handleAddBanner = () => {
    const nextOrder = banners.length + 1;
    const newBanner: TenantPromoBanner = {
      id: `promo-${Date.now()}`,
      title: "NUEVA TARJETA DE ESPECIALIDAD",
      subtitle: "Destaca la preparación artesanal, ingredientes o combos exclusivos de tu negocio.",
      ctaText: "Ver Especialidad",
      ctaHref: "/catalogo",
      imageUrl: "/images/banners/promo-receta-tradicional.jpg",
      themeVariant: "dark",
      displayOrder: nextOrder,
      isActive: true,
    };
    onChange([...banners, newBanner]);
  };

  const handleUpdateBanner = (
    index: number,
    patch: Partial<TenantPromoBanner>
  ) => {
    const updated = banners.map((b, idx) =>
      idx === index ? { ...b, ...patch } : b
    );
    onChange(updated);
  };

  const handleRemoveBanner = (index: number) => {
    const filtered = banners
      .filter((_, idx) => idx !== index)
      .map((b, idx) => ({ ...b, displayOrder: idx + 1 }));
    onChange(filtered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black uppercase tracking-wide text-text-inverse-strong font-display">
            Tarjetas Promocionales de Especialidad ({banners.length})
          </h3>
          <p className="text-xs text-text-inverse-muted">
            Personaliza los bloques destacados intermedios de la página principal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddBanner}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir Tarjeta</span>
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-surface-dark-border text-center text-xs text-text-inverse-muted">
          No hay tarjetas promocionales activas.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className="bg-surface-dark-card border border-surface-dark-border rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-surface-dark-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-dark-hover text-[10px] font-mono font-bold text-brand-accent border border-surface-dark-border">
                    Banner #{idx + 1}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-text-inverse-base cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={(e) =>
                        handleUpdateBanner(idx, { isActive: e.target.checked })
                      }
                      className="rounded border-surface-dark-border"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBanner(idx)}
                  aria-label={`Eliminar banner ${idx + 1}`}
                  className="text-status-danger hover:bg-status-danger/15 p-2 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                    Título de la Tarjeta
                  </label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) =>
                      handleUpdateBanner(idx, { title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-display font-bold uppercase tracking-wide focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={banner.subtitle}
                    onChange={(e) =>
                      handleUpdateBanner(idx, { subtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                      Texto Botón
                    </label>
                    <input
                      type="text"
                      value={banner.ctaText}
                      onChange={(e) =>
                        handleUpdateBanner(idx, { ctaText: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                      Imagen de Fondo
                    </label>
                    <select
                      value={banner.imageUrl}
                      onChange={(e) =>
                        handleUpdateBanner(idx, { imageUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong focus:outline-none focus:border-brand-primary"
                    >
                      <option value="/images/banners/promo-receta-tradicional.jpg">
                        Receta Tradicional
                      </option>
                      <option value="/images/banners/promo-hecho-a-la-brasa.jpg">
                        Fuego y Brasa
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

