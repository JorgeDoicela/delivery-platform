"use client";

import React from "react";
import type { TenantHeroSlide } from "@/shared/types/api";
import { Plus, Trash2 } from "lucide-react";
import { Select, type SelectOption } from "@/shared/components/Select";

const HERO_GALLERY_OPTIONS: SelectOption[] = [
  {
    value: "/images/tenants/la-granjita/banners/hero-pollo-brasa.jpg",
    label: "Brasa & Asador (/images/tenants/la-granjita/banners/hero-pollo-brasa.jpg)",
  },
  {
    value: "/images/tenants/la-granjita/banners/hero-combo-familiar.jpg",
    label: "Banquete Familiar (/images/tenants/la-granjita/banners/hero-combo-familiar.jpg)",
  },
  {
    value: "/images/tenants/la-granjita/banners/hero-combo-personal.jpg",
    label: "Especial Personal (/images/tenants/la-granjita/banners/hero-combo-personal.jpg)",
  },
  {
    value: "/images/tenants/brasas-del-valle/banners/promo-hecho-a-la-brasa.jpg",
    label: "Horno & Fuego (/images/tenants/brasas-del-valle/banners/promo-hecho-a-la-brasa.jpg)",
  },
  {
    value: "/images/tenants/brasas-del-valle/banners/promo-receta-tradicional.jpg",
    label: "Mesa Familiar (/images/tenants/brasas-del-valle/banners/promo-receta-tradicional.jpg)",
  },
  {
    value: "/images/platform/hero-platform.jpg",
    label: "Portada Plataforma (/images/platform/hero-platform.jpg)",
  },
  {
    value: "custom",
    label: "URL Personalizada Externa / Propia",
  },
];

interface HeroSlidesEditorProps {
  slides: TenantHeroSlide[];
  onChange: (slides: TenantHeroSlide[]) => void;
}

export function HeroSlidesEditor({ slides, onChange }: HeroSlidesEditorProps) {
  const handleAddSlide = () => {
    const nextOrder = slides.length + 1;
    const newSlide: TenantHeroSlide = {
      id: `slide-${Date.now()}`,
      badge: "Nueva Promoción",
      title: "TITULAR PRINCIPAL DEL BANNER",
      subtitle: "Describe aquí los ingredientes, acompañantes y beneficios de la promoción.",
      ctaText: "ORDENA AQUÍ",
      ctaHref: "/catalogo",
      imageUrl: "/images/tenants/la-granjita/banners/hero-pollo-brasa.jpg",
      displayOrder: nextOrder,
      isActive: true,
    };
    onChange([...slides, newSlide]);
  };

  const handleUpdateSlide = (
    index: number,
    patch: Partial<TenantHeroSlide>
  ) => {
    const updated = slides.map((s, idx) =>
      idx === index ? { ...s, ...patch } : s
    );
    onChange(updated);
  };

  const handleRemoveSlide = (index: number) => {
    const filtered = slides
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, displayOrder: idx + 1 }));
    onChange(filtered);
  };

  const inputClass =
    "w-full px-3 py-2 rounded-xl bg-surface-canvas border border-surface-border text-text-strong focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-colors placeholder:text-text-muted";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black uppercase tracking-wide text-text-strong font-display">
            Slides del Carrusel Hero Principal ({slides.length})
          </h3>
          <p className="text-xs text-text-muted">
            Configura las imágenes panorámicas, titulares y botones de llamada a la acción de la portada.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddSlide}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir Slide</span>
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-surface-border text-center text-xs text-text-muted">
          No hay slides configurados. Añade un slide para personalizar el carrusel principal.
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-4 shadow-xs transition-colors duration-200"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-canvas text-[10px] font-mono font-bold text-brand-accent border border-surface-border">
                    Slide #{idx + 1}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-text-strong cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={(e) =>
                        handleUpdateSlide(idx, { isActive: e.target.checked })
                      }
                      className="rounded border-surface-border"
                    />
                    <span>Visible en portada</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSlide(idx)}
                  aria-label={`Eliminar slide ${idx + 1}`}
                  className="text-status-danger hover:bg-status-danger/15 p-2 rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Badge Superior
                  </label>
                  <input
                    type="text"
                    value={slide.badge}
                    onChange={(e) =>
                      handleUpdateSlide(idx, { badge: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Titular de Impacto (H1)
                  </label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) =>
                      handleUpdateSlide(idx, { title: e.target.value })
                    }
                    className={`${inputClass} font-display font-bold uppercase tracking-wide`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Subtítulo Descriptivo
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) =>
                      handleUpdateSlide(idx, { subtitle: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Texto Botón CTA
                  </label>
                  <input
                    type="text"
                    value={slide.ctaText}
                    onChange={(e) =>
                      handleUpdateSlide(idx, { ctaText: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Ruta Destino CTA
                  </label>
                  <input
                    type="text"
                    value={slide.ctaHref}
                    onChange={(e) =>
                      handleUpdateSlide(idx, { ctaHref: e.target.value })
                    }
                    className={`${inputClass} font-mono`}
                  />
                </div>

                <div>
                  <Select
                    label="Galería Rápida de Portada"
                    options={HERO_GALLERY_OPTIONS}
                    value={
                      HERO_GALLERY_OPTIONS.some((opt) => opt.value === slide.imageUrl)
                        ? slide.imageUrl
                        : "custom"
                    }
                    onChange={(val) => {
                      if (val !== "custom") {
                        handleUpdateSlide(idx, { imageUrl: val });
                      }
                    }}
                    size="sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    URL o Ruta de Imagen Panorámica (admite cualquier URL https:// o /images/...)
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="w-28 h-16 rounded-xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.imageUrl || "/images/tenants/la-granjita/banners/hero-pollo-brasa.jpg"}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <input
                      type="text"
                      value={slide.imageUrl}
                      onChange={(e) =>
                        handleUpdateSlide(idx, { imageUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/... o /images/tenants/uploads/mi-banner.jpg"
                      className={`${inputClass} font-mono`}
                    />
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
