"use client";

import React, { useState } from "react";
import { X, Loader2, Building2, Palette, ShieldCheck } from "lucide-react";
import type { CreateTenantCommand } from "@/shared/types/api";
import { useCreateTenantMutation } from "../hooks/useTenantQueries";
import { RESERVED_TENANT_SLUGS } from "../constants";

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdSlug: string) => void;
}

const INITIAL_FORM: CreateTenantCommand = {
  name: "",
  slug: "",
  businessName: "",
  taxId: "",
  tagline: "Asadero & Parrilla Artesanal",
  description: "Especialidades a la brasa con ingredientes frescos y entrega rápida.",
  brandPrimaryColor: "#B91C1C",
  brandPrimaryHoverColor: "#991B1B",
  brandAccentColor: "#F59E0B",
  baseDeliveryFee: 1.75,
  contactPhone: "0990001122",
  contactEmail: "",
  primaryBranchName: "Matriz Principal",
  primaryBranchAddress: "",
  adminFullName: "",
  adminEmail: "",
  adminPassword: "Admin123!",
};

export function CreateTenantModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTenantModalProps) {
  const [form, setForm] = useState<CreateTenantCommand>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateTenantMutation();

  if (!isOpen) return null;

  const handleNameChange = (value: string) => {
    const autoSlug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        ? autoSlug
        : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normalizedSlug = form.slug.trim().toLowerCase();
    if (RESERVED_TENANT_SLUGS.has(normalizedSlug)) {
      setFormError("El identificador (slug) ingresado corresponde a una ruta reservada de la plataforma.");
      return;
    }

    try {
      const result = await createMutation.mutateAsync(form);
      setForm(INITIAL_FORM);
      onSuccess(result.slug);
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo aprovisionar el nuevo comercio."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-create-tenant-title"
    >
      <div className="w-full max-w-2xl bg-surface-dark-card border border-surface-dark-border rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-surface-dark-border flex items-center justify-between bg-surface-dark/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent block">
              Aprovisionamiento Multi-Tenant SaaS
            </span>
            <h2
              id="modal-create-tenant-title"
              className="text-xl font-black uppercase tracking-tight text-white font-display"
            >
              Registrar Nuevo Comercio y Administrador
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-status-danger/15 border border-status-danger/40 text-xs text-red-200 font-semibold">
              {formError}
            </div>
          )}

          {/* 1. Datos Comerciales y Fiscales */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-accent">
              <Building2 className="w-4 h-4" />
              <span>1. Identidad Comercial y Tributaria</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Parrilladas El Gaucho"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Slug URL (Subdominio / Identificador) *
                </label>
                <input
                  type="text"
                  required
                  pattern="^[a-z0-9-]+$"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value.toLowerCase() })
                  }
                  placeholder="ej. el-gaucho"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm font-mono text-brand-accent focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Razón Social (SRI) *
                </label>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Ej. Alimentos El Gaucho S.A.S."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  RUC / Identificación Tributaria *
                </label>
                <input
                  type="text"
                  required
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  placeholder="1790011223001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm font-mono text-white focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* 2. Personalización Visual y Sucursal Matriz */}
          <div className="space-y-3 pt-2 border-t border-surface-dark-border">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-accent">
              <Palette className="w-4 h-4" />
              <span>2. Tema de Marca y Sucursal Matriz</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Color Primario (#HEX)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.brandPrimaryColor}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        brandPrimaryColor: e.target.value,
                        brandPrimaryHoverColor: e.target.value,
                      })
                    }
                    className="w-10 h-10 rounded-lg bg-surface-dark border border-surface-dark-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.brandPrimaryColor}
                    onChange={(e) =>
                      setForm({ ...form, brandPrimaryColor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Tarifa Envío Base (USD)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  required
                  value={form.baseDeliveryFee}
                  onChange={(e) =>
                    setForm({ ...form, baseDeliveryFee: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Teléfono Comercial
                </label>
                <input
                  type="text"
                  required
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Nombre de Sucursal Matriz *
                </label>
                <input
                  type="text"
                  required
                  value={form.primaryBranchName}
                  onChange={(e) =>
                    setForm({ ...form, primaryBranchName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Dirección de Sucursal Matriz *
                </label>
                <input
                  type="text"
                  required
                  value={form.primaryBranchAddress}
                  onChange={(e) =>
                    setForm({ ...form, primaryBranchAddress: e.target.value })
                  }
                  placeholder="Av. República y Eloy Alfaro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Credenciales del TenantAdmin Inicial */}
          <div className="space-y-3 pt-2 border-t border-surface-dark-border">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-accent">
              <ShieldCheck className="w-4 h-4" />
              <span>3. Cuenta Propietaria (TenantAdmin)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Nombre del Administrador *
                </label>
                <input
                  type="text"
                  required
                  value={form.adminFullName}
                  onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
                  placeholder="Ej. Roberto Gómez"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Correo de Acceso *
                </label>
                <input
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      adminEmail: e.target.value,
                      contactEmail: e.target.value,
                    })
                  }
                  placeholder="gerencia@comercio.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
                  Contraseña Inicial *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-sm font-mono text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-dark-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-surface-dark-border text-xs font-bold uppercase tracking-wider text-text-inverse-muted hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider font-display inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Aprovisionar Comercio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

