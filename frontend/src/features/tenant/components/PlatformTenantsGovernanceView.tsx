"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Palette,
  Plus,
  Power,
  RefreshCw,
  ShieldAlert,
  Store,
  UserCheck,
} from "lucide-react";
import { useTenantStore } from "../store/useTenantStore";
import { useAuthStore, UserRole } from "@/features/auth";
import {
  usePlatformTenantsQuery,
  useToggleTenantStatusMutation,
} from "../hooks/useTenantQueries";
import { CreateTenantModal } from "./CreateTenantModal";

export function PlatformTenantsGovernanceView() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = usePlatformTenantsQuery();
  const toggleStatusMutation = useToggleTenantStatusMutation();
  const activeTenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const isRestrictedRole =
    Boolean(user) &&
    user?.role !== "SuperAdmin" &&
    user?.role !== UserRole.SuperAdmin &&
    !user?.roles?.includes("SuperAdmin");

  if (isRestrictedRole) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto gap-4">
        <div className="w-12 h-12 rounded-2xl bg-status-danger/20 border border-status-danger/40 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-white font-display">
          Acceso Restringido a SuperAdmin (403)
        </h2>
        <p className="text-xs text-text-inverse-muted">
          Tu cuenta actual pertenece al ámbito operativo de franquicia ({user?.email}). El aprovisionamiento global de comercios está reservado para el SuperAdmin de la plataforma.
        </p>
        <Link
          href="/admin/personalizacion"
          className="px-5 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
        >
          <span>Ir al Panel de mi Franquicia</span>
        </Link>
      </div>
    );
  }

  const tenants = data?.tenants ?? [];
  const activeCount = tenants.filter((t) => t.isActive).length;
  const totalBranches = tenants.reduce((acc, t) => acc + t.branchesCount, 0);
  const totalProducts = tenants.reduce((acc, t) => acc + t.productsCount, 0);

  const handleToggleStatus = async (
    tenantId: string,
    slug: string,
    currentActive: boolean,
    name: string
  ) => {
    try {
      await toggleStatusMutation.mutateAsync({
        tenantId,
        isActive: !currentActive,
      });
      if (currentActive && slug === activeTenantSlug) {
        const fallbackTenant = tenants.find((t) => t.id !== tenantId && t.isActive);
        setTenantSlug(fallbackTenant?.slug ?? "la-granjita");
      }
      setBannerNotice(
        `El estado operativo de "${name}" se actualizó a ${!currentActive ? "ACTIVO" : "SUSPENDIDO"}.`
      );
    } catch {
      setBannerNotice(`No se pudo cambiar el estado del comercio "${name}".`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-text-inverse-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-xs font-bold uppercase tracking-widest">
          Cargando directorio global de comercios SaaS...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto gap-4">
        <div className="w-12 h-12 rounded-2xl bg-status-danger/20 border border-status-danger/40 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-white font-display">
          Error al consultar los comercios de la plataforma
        </h2>
        <p className="text-xs text-text-inverse-muted">
          {error instanceof Error
            ? error.message
            : "Verifica que el backend .NET 8 esté activo en el puerto 5005."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar conexión</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-10">
      {/* Cabecera de Gobernanza Global SaaS */}
      <div className="bg-surface-dark-card border border-surface-dark-border rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent block mb-1">
            Consola SuperAdmin • Gobernanza Multi-Marca
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
            Restaurantes & Franquicias Afiliadas
          </h1>
          <p className="text-xs text-text-inverse-muted mt-1 max-w-2xl">
            Administra el ciclo de vida de cada restaurante en la plataforma: afilia nuevos comercios con su propia sucursal matriz, catálogo independiente, colores corporativos y cuenta de administración.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-full bg-surface-dark hover:bg-surface-dark-hover border border-surface-dark-border text-xs font-bold uppercase tracking-wider text-text-inverse-muted hover:text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display inline-flex items-center gap-2 shadow-lg shadow-brand-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Afiliar Nuevo Restaurante</span>
          </button>
        </div>
      </div>

      {bannerNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl px-5 py-3 flex items-center justify-between text-xs text-emerald-200 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-[11px] uppercase tracking-wider font-bold text-emerald-300 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-dark-card border border-surface-dark-border rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted block">
            Total Marcas Registradas
          </span>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {tenants.length}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">
            {activeCount} activas en tienda pública
          </span>
        </div>

        <div className="bg-surface-dark-card border border-surface-dark-border rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted block">
            Sucursales Georreferenciadas
          </span>
          <div className="text-3xl font-black text-brand-accent font-mono mt-1">
            {totalBranches}
          </div>
          <span className="text-[11px] text-text-inverse-muted">
            Con geocerca PostGIS activa
          </span>
        </div>

        <div className="bg-surface-dark-card border border-surface-dark-border rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted block">
            Productos en Catálogos
          </span>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {totalProducts}
          </div>
          <span className="text-[11px] text-text-inverse-muted">
            Aislados por TenantId
          </span>
        </div>

        <div className="bg-surface-dark-card border border-surface-dark-border rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted block">
            Contexto Activo en Consola
          </span>
          <div className="text-lg font-black text-brand-primary font-mono mt-1 truncate">
            {activeTenantSlug}
          </div>
          <span className="text-[11px] text-text-inverse-muted">
            Header X-Tenant-Slug sincronizado
          </span>
        </div>
      </div>

      {/* Grilla de Comercios de la Plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {tenants.map((tenant) => {
          const isCurrentContext = tenant.slug === activeTenantSlug;

          return (
            <article
              key={tenant.id}
              className={`bg-surface-dark-card rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                isCurrentContext
                  ? "border-brand-accent ring-1 ring-brand-accent/40"
                  : "border-surface-dark-border"
              }`}
            >
              <div>
                {/* Barra superior con color corporativo del Tenant */}
                <div
                  className="h-2.5 w-full"
                  style={{ backgroundColor: tenant.brandPrimaryColor }}
                />

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0"
                        style={{ backgroundColor: tenant.brandPrimaryColor }}
                      >
                        <Store className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black uppercase tracking-tight text-white font-display leading-none">
                            {tenant.name}
                          </h2>
                          {isCurrentContext && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
                              Seleccionado
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-text-inverse-muted mt-1">
                          slug: <strong className="text-white">{tenant.slug}</strong> • RUC:{" "}
                          {tenant.taxId}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        tenant.isActive
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-red-500/15 text-red-300 border-red-500/30"
                      }`}
                    >
                      {tenant.isActive ? "Activo" : "Suspendido"}
                    </span>
                  </div>

                  <p className="text-xs text-text-inverse-muted line-clamp-2 min-h-[2.25rem]">
                    {tenant.description || tenant.tagline}
                  </p>

                  {/* Ficha técnica del tenant */}
                  <div className="bg-surface-dark rounded-2xl p-3.5 border border-surface-dark-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-inverse-muted flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-brand-accent" />
                        <span>TenantAdmin:</span>
                      </span>
                      <span className="font-mono text-white font-semibold truncate max-w-[190px]">
                        {tenant.adminEmail}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-inverse-muted flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-status-info" />
                        <span>Sucursales / Menú:</span>
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {tenant.branchesCount} local(es) • {tenant.productsCount} ítems
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-inverse-muted flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tarifa envío base:</span>
                      </span>
                      <span className="font-mono text-emerald-300 font-bold">
                        ${tenant.baseDeliveryFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones de Gobernanza por Tenant */}
              <div className="px-5 py-3.5 bg-surface-dark/70 border-t border-surface-dark-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTenantSlug(tenant.slug);
                      setBannerNotice(
                        `Contexto operativo cambiado a "${tenant.name}" (${tenant.slug}).`
                      );
                    }}
                    className="px-3 py-1.5 rounded-full bg-surface-dark-hover hover:bg-brand-primary text-white text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Gestionar Marca</span>
                  </button>

                  <Link
                    href={`/${tenant.slug}`}
                    onClick={() => setTenantSlug(tenant.slug)}
                    className="px-3 py-1.5 rounded-full border border-surface-dark-border hover:border-white/40 text-text-inverse-muted hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                  >
                    <span>Ver Tienda</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <button
                  type="button"
                  disabled={toggleStatusMutation.isPending}
                  onClick={() =>
                    handleToggleStatus(
                      tenant.id,
                      tenant.slug,
                      tenant.isActive,
                      tenant.name
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    tenant.isActive
                      ? "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30"
                      : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{tenant.isActive ? "Suspender" : "Activar"}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <CreateTenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(createdSlug) => {
          setTenantSlug(createdSlug);
          setBannerNotice(
            `Nuevo comercio "${createdSlug}" aprovisionado exitosamente con sucursal matriz, catálogo inicial y usuario TenantAdmin.`
          );
        }}
      />
    </div>
  );
}

