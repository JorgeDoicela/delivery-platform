"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
        <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950 font-display">
          Acceso Restringido a SuperAdmin
        </h2>
        <p className="text-xs text-neutral-600">
          Tu cuenta actual pertenece al ámbito operativo de franquicia ({user?.email}). El aprovisionamiento global de comercios está reservado para el SuperAdmin de la plataforma.
        </p>
        <Link
          href="/admin/personalizacion"
          className="px-5 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider font-display inline-flex items-center gap-2"
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
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-xs font-bold uppercase tracking-widest font-mono">
          Cargando directorio global de comercios SaaS...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto gap-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950 font-display">
          Error al consultar los comercios de la plataforma
        </h2>
        <p className="text-xs text-neutral-600">
          {error instanceof Error
            ? error.message
            : "Verifica que el backend .NET 8 esté activo en el puerto 5005."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider font-display inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Reintentar conexión</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-10">
      {/* Cabecera de Gobernanza Global SaaS (Fondo Blanco Luminoso) */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1 font-display">
            CONSOLA SUPERADMIN • GOBERNANZA MULTI-MARCA
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-neutral-950 font-display">
            Restaurantes & Franquicias Afiliadas
          </h1>
          <p className="text-xs text-neutral-600 mt-1.5 max-w-2xl font-sans leading-relaxed">
            Administra el ciclo de vida de cada restaurante en la plataforma: afilia nuevos comercios con su propia sucursal matriz, catálogo independiente, colores corporativos y cuenta de administración.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold uppercase tracking-wider font-display text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer shadow-xs"
          >
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display transition-all cursor-pointer shadow-md active:scale-95"
          >
            + Afiliar Nuevo Restaurante
          </button>
        </div>
      </div>

      {bannerNotice && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl px-5 py-3.5 flex items-center justify-between text-xs text-neutral-900 font-medium shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 hover:text-neutral-900 cursor-pointer ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Globales (Fondo Blanco Luminoso) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
            Total Marcas Registradas
          </span>
          <div className="text-2xl font-black text-neutral-950 font-mono tabular-nums mt-1">
            {tenants.length}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block font-sans">
            {activeCount} activas en tienda pública
          </span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
            Sucursales Georreferenciadas
          </span>
          <div className="text-2xl font-black text-neutral-950 font-mono tabular-nums mt-1">
            {totalBranches}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block font-sans">
            Con geocerca PostGIS activa
          </span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
            Productos en Catálogos
          </span>
          <div className="text-2xl font-black text-neutral-950 font-mono tabular-nums mt-1">
            {totalProducts}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block font-sans">
            Aislados por TenantId
          </span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
            Contexto Activo en Consola
          </span>
          <div className="text-lg font-black text-brand-primary font-mono mt-1 truncate">
            {activeTenantSlug}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block font-sans">
            Header X-Tenant-Slug sincronizado
          </span>
        </div>
      </div>

      {/* Grilla de Comercios de la Plataforma (Tarjetas Blancas Puras) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {tenants.map((tenant) => {
          const isCurrentContext = tenant.slug === activeTenantSlug;

          return (
            <article
              key={tenant.id}
              className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden p-6 sm:p-7 shadow-xs hover:shadow-md ${
                isCurrentContext
                  ? "border-brand-primary ring-2 ring-brand-primary/20"
                  : "border-neutral-200/90 hover:border-neutral-300"
              }`}
            >
              <div>
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-950 font-display leading-tight">
                      {tenant.name}
                    </h2>
                    {isCurrentContext && (
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-brand-primary block mt-0.5">
                        • Contexto Activo
                      </span>
                    )}
                    <p className="text-xs font-mono text-neutral-500 mt-1">
                      slug: <strong className="text-neutral-800">{tenant.slug}</strong> • RUC: {tenant.taxId}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold font-mono uppercase tracking-wider shrink-0 ${
                      tenant.isActive ? "text-status-success" : "text-status-danger"
                    }`}
                  >
                    {tenant.isActive ? "Activo" : "Suspendido"}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 mt-3 line-clamp-2 min-h-[2.25rem] font-sans leading-relaxed">
                  {tenant.description || tenant.tagline}
                </p>

                {/* Ficha técnica del tenant (Fondo gris neutro limpio, sin fondos pastel ni iconos saturados) */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2.5 text-xs font-mono my-5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">TenantAdmin:</span>
                    <span className="text-neutral-900 font-semibold truncate max-w-[200px]">
                      {tenant.adminEmail}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Sucursales / Menú:</span>
                    <span className="text-neutral-900 font-semibold">
                      {tenant.branchesCount} {tenant.branchesCount === 1 ? "local" : "locales"} • {tenant.productsCount} ítems
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Tarifa envío base:</span>
                    <span className="text-neutral-950 font-bold tabular-nums">
                      ${tenant.baseDeliveryFee.toFixed(2)}
                    </span>
                  </div>

                  {tenant.customDomain && (
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                      <span className="text-neutral-500">Dominio propio:</span>
                      <span className="text-brand-accent font-bold truncate max-w-[200px]">
                        {tenant.customDomain}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones de Gobernanza por Tenant */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTenantSlug(tenant.slug);
                      setBannerNotice(
                        `Contexto operativo cambiado a "${tenant.name}" (${tenant.slug}).`
                      );
                    }}
                    className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold uppercase tracking-wider font-display transition-colors cursor-pointer"
                  >
                    Gestionar Marca
                  </button>

                  <Link
                    href={`/${tenant.slug}`}
                    onClick={() => setTenantSlug(tenant.slug)}
                    className="px-4 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-bold uppercase tracking-wider font-display transition-colors"
                  >
                    Ver Tienda
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
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-display transition-colors cursor-pointer border ${
                    tenant.isActive
                      ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                  }`}
                >
                  {tenant.isActive ? "Suspender" : "Activar"}
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
