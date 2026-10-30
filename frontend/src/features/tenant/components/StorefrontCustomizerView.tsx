"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  TenantHeroSlide,
  TenantPromoBanner,
  TenantStorefrontConfigDto,
  UpdateTenantStorefrontCommand,
} from "@/shared/types/api";
import {
  useCurrentTenantQuery,
  useUpdateTenantStorefrontMutation,
} from "../hooks/useTenantQueries";
import { StorefrontBrandingSection } from "./StorefrontBrandingSection";
import { StorefrontOperationsSection } from "./StorefrontOperationsSection";
import { HeroSlidesEditor } from "./HeroSlidesEditor";
import { PromoBannersEditor } from "./PromoBannersEditor";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

type ActiveTab = "branding" | "hero" | "promos" | "operations";

export function StorefrontCustomizerView() {
  const { data: tenant, isLoading: isFetching } = useCurrentTenantQuery();

  if (isFetching || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-inverse-muted">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Cargando configuración del Storefront...
        </span>
      </div>
    );
  }

  return <StorefrontCustomizerForm key={tenant.slug} tenant={tenant} />;
}

function StorefrontCustomizerForm({
  tenant,
}: {
  tenant: TenantStorefrontConfigDto;
}) {
  const updateMutation = useUpdateTenantStorefrontMutation();

  const [activeTab, setActiveTab] = useState<ActiveTab>("branding");
  const [formState, setFormState] = useState<UpdateTenantStorefrontCommand>(() => ({
    name: tenant.name,
    tagline: tenant.tagline,
    description: tenant.description,
    heroSubtitle: tenant.heroSubtitle,
    businessName: tenant.businessName,
    taxId: tenant.taxId,
    logoUrl: tenant.logoUrl,
    brandPrimaryColor: tenant.brandPrimaryColor,
    brandPrimaryHoverColor: tenant.brandPrimaryHoverColor,
    brandAccentColor: tenant.brandAccentColor,
    contactPhone: tenant.contactPhone,
    contactEmail: tenant.contactEmail,
    baseDeliveryFee: tenant.baseDeliveryFee,
    enableDelivery: tenant.enableDelivery,
    enableTakeout: tenant.enableTakeout,
    enableDineIn: tenant.enableDineIn,
    acceptsCash: tenant.acceptsCash,
    acceptsBankTransfer: tenant.acceptsBankTransfer,
    acceptsCard: tenant.acceptsCard,
    quickLinksEnabled: tenant.quickLinksEnabled,
    landingLayoutTemplate: tenant.landingLayoutTemplate ?? "asadero-clasico",
    bankDetails: { ...tenant.bankDetails },
    heroSlides: [...tenant.heroSlides],
    promotionalBanners: [...tenant.promotionalBanners],
  }));
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null
  );

  const handleField = <K extends keyof UpdateTenantStorefrontCommand>(
    key: K,
    value: UpdateTenantStorefrontCommand[K]
  ) => {
    setSaveSuccessMessage(null);
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMessage(null);

    try {
      await updateMutation.mutateAsync(formState);
      setSaveSuccessMessage(
        "La identidad de marca y la landing page se han actualizado en vivo."
      );
    } catch {
      // El error queda expuesto en updateMutation.error
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-6xl mx-auto pb-12 overflow-y-auto max-h-[calc(100vh-95px)] pr-2"
    >
      {/* Cabecera de Personalización */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-dark-border gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-accent block">
            Motor SaaS Multi-Tenant • Slug: {tenant?.slug}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-inverse-strong font-display mt-0.5">
            Personalización de Marca & Landing Page
          </h1>
          <p className="text-xs text-text-inverse-muted mt-1">
            Configura colores, logotipo, carrusel Hero, tarjetas promocionales, tarifas y cuenta bancaria de {formState.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full bg-surface-dark-card hover:bg-surface-dark-hover border border-surface-dark-border text-xs font-bold uppercase tracking-wider text-text-inverse-strong transition-colors"
          >
            Ver Landing en Vivo
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {updateMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Alertas de Estado */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-status-success/15 border border-status-success/40 text-status-success text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-bold">{saveSuccessMessage}</span>
        </div>
      )}

      {updateMutation.isError && (
        <div className="p-4 rounded-2xl bg-status-danger/15 border border-status-danger/40 text-status-danger text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "No se pudo guardar la configuración en el servidor."}
          </span>
        </div>
      )}

      {/* Pestañas de Secciones */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-dark-border pb-3">
        {(
          [
            ["branding", "1. Identidad & Paleta de Colores"],
            ["hero", "2. Carrusel Hero Principal"],
            ["promos", "3. Tarjetas Promocionales"],
            ["operations", "4. Tarifas, Pagos & Banco"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider font-display transition-all ${
              activeTab === key
                ? "bg-brand-primary text-white shadow-md"
                : "bg-surface-dark-card text-text-inverse-muted hover:text-white border border-surface-dark-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Identidad & Colores */}
      {activeTab === "branding" && (
        <StorefrontBrandingSection
          formState={formState}
          onFieldChange={handleField}
        />
      )}

      {/* Tab 2: Carrusel Hero */}
      {activeTab === "hero" && (
        <HeroSlidesEditor
          slides={formState.heroSlides}
          onChange={(slides: TenantHeroSlide[]) =>
            handleField("heroSlides", slides)
          }
        />
      )}

      {/* Tab 3: Tarjetas Promocionales */}
      {activeTab === "promos" && (
        <PromoBannersEditor
          banners={formState.promotionalBanners}
          onChange={(banners: TenantPromoBanner[]) =>
            handleField("promotionalBanners", banners)
          }
        />
      )}

      {/* Tab 4: Tarifas, Modalidades y Banco */}
      {activeTab === "operations" && (
        <StorefrontOperationsSection
          formState={formState}
          onFieldChange={handleField}
        />
      )}
    </form>
  );
}
