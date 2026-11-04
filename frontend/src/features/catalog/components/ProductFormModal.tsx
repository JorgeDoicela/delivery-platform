"use client";

import React, { useState, useRef } from "react";
import { X, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { apiClient } from "@/shared/lib/api-client";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";
import type { MenuProductDto, UpsertProductCommand } from "@/shared/types/api";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: (MenuProductDto & { categoryName?: string }) | null;
  existingCategories: string[];
  onSaved: (message: string) => void;
}

const PRESET_PRODUCT_IMAGES = [
  {
    label: "Plato Estándar (/images/shared/placeholders/dish-default.webp)",
    value: "/images/shared/placeholders/dish-default.webp",
  },
  {
    label: "Combo Familiar La Granjita (/images/tenants/la-granjita/menu/combo-familiar.webp)",
    value: "/images/tenants/la-granjita/menu/combo-familiar.webp",
  },
  {
    label: "Porción Mediana La Granjita (/images/tenants/la-granjita/menu/medio-pollo.webp)",
    value: "/images/tenants/la-granjita/menu/medio-pollo.webp",
  },
  {
    label: "Porción Personal La Granjita (/images/tenants/la-granjita/menu/cuarto-pollo.webp)",
    value: "/images/tenants/la-granjita/menu/cuarto-pollo.webp",
  },
  {
    label: "Parrillada Brasas del Valle (/images/tenants/brasas-del-valle/menu/combo-familiar.webp)",
    value: "/images/tenants/brasas-del-valle/menu/combo-familiar.webp",
  },
  {
    label: "Especialidad Brasa (/images/tenants/la-granjita/banners/hero-pollo-brasa.jpg)",
    value: "/images/tenants/la-granjita/banners/hero-pollo-brasa.jpg",
  },
];

export function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  existingCategories,
  onSaved,
}: ProductFormModalProps) {
  const isEditing = Boolean(productToEdit);
  const currentTenantSlug = useTenantStore((s) => s.tenantSlug) || "la-granjita";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState<UpsertProductCommand>(() => ({
    productId: productToEdit?.id ?? null,
    name: productToEdit?.name ?? "",
    description: productToEdit?.description ?? "",
    basePrice: productToEdit?.basePrice ?? 9.99,
    category:
      productToEdit?.categoryName ||
      productToEdit?.category ||
      existingCategories[0] ||
      "Combos",
    imageUrl: productToEdit?.imageUrl || "/images/shared/placeholders/dish-default.webp",
    isActive: productToEdit?.isActive ?? true,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPresetImage = PRESET_PRODUCT_IMAGES.some(
    (p) => p.value === form.imageUrl
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("tenantSlug", currentTenantSlug);
      data.append("category", "menu");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir la imagen.");
      }

      const result = await response.json();
      setForm((prev) => ({ ...prev, imageUrl: result.url }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isEditing && productToEdit) {
        const updated = await apiClient.updateProduct(productToEdit.id, form);
        onSaved(`Producto "${updated.name}" e imagen actualizados correctamente.`);
      } else {
        const created = await apiClient.createProduct(form);
        onSaved(`Nuevo producto "${created.name}" incorporado al catálogo del establecimiento.`);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el producto en el catálogo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-form-title"
    >
      <div className="w-full max-w-xl bg-surface-dark-card border border-surface-dark-border rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-surface-dark-border flex items-center justify-between bg-surface-dark/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent block">
              Catálogo Multi-Tenant • Imagen yFicha de Producto
            </span>
            <h2
              id="modal-product-form-title"
              className="text-xl font-black uppercase tracking-tight text-white font-display"
            >
              {isEditing ? `Editar Producto #${productToEdit?.id}` : "Crear Nuevo Producto"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-full text-text-inverse-muted hover:text-white hover:bg-surface-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-status-danger/20 border border-status-danger/40 text-status-danger font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                Nombre del Plato o Combo *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Parrillada Especial de la Casa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white font-bold focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                Categoría del Menú *
              </label>
              <input
                type="text"
                required
                list="tenant-categories-list"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ej. Combos, Cortes, Bebidas"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white focus:outline-none focus:border-brand-primary"
              />
              <datalist id="tenant-categories-list">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                Precio Base (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.25"
                required
                value={form.basePrice}
                onChange={(e) =>
                  setForm({ ...form, basePrice: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm font-mono text-brand-accent font-bold focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                Descripción Gastronómica *
              </label>
              <textarea
                rows={2}
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Detalla cortes, porciones, guarniciones y salsas incluidas..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Sección de Fotografía Personalizada del Producto */}
          <div className="pt-3 border-t border-surface-dark-border space-y-3">
            <div className="flex items-center gap-2 text-brand-accent font-bold uppercase tracking-wider text-[11px]">
              <ImageIcon className="w-4 h-4" />
              <span>Fotografía del Producto (Propia por Establecimiento)</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Subir Foto desde tu Equipo (Multi-Tenant Aislado)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-surface-dark-hover hover:bg-brand-primary text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 border border-surface-dark-border transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploading ? "Subiendo imagen..." : "Seleccionar Archivo Local"}</span>
                </button>
              </div>

              <div className="text-[11px] text-text-inverse-muted sm:text-right">
                <span>Destino aislado: </span>
                <code className="text-brand-accent font-mono">/tenants/{currentTenantSlug}/menu/</code>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                Seleccionar de Galería Local o Usar URL Propia
              </label>
              <select
                value={isPresetImage ? form.imageUrl : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setForm({ ...form, imageUrl: e.target.value });
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-white focus:outline-none focus:border-brand-primary"
              >
                {PRESET_PRODUCT_IMAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
                <option value="custom">URL Personalizada Externa / Propia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                URL o Ruta de la Imagen (https://... o /images/...) *
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-dark border border-surface-dark-border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl || "/images/shared/placeholders/dish-default.webp"}
                    alt={form.name || "Vista previa"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/... o /images/tenants/uploads/mi-plato.webp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-white font-mono text-xs focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-dark-border flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-text-inverse-base cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="rounded border-surface-dark-border"
              />
              <span>Disponible inmediatamente en el menú</span>
            </label>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-surface-dark-border text-text-inverse-muted hover:text-white font-bold uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white font-black uppercase tracking-wider font-display inline-flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditing ? "Guardar Cambios" : "Crear Producto"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

