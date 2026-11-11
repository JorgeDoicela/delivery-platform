"use client";

import React, { useEffect } from "react";
import { useTenantStore } from "../store/useTenantStore";
import { CatalogSection } from "@/features/catalog";

interface RestaurantDedicatedMenuViewProps {
  initialSlug: string;
}

export function RestaurantDedicatedMenuView({
  initialSlug,
}: RestaurantDedicatedMenuViewProps) {
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const currentSlug = useTenantStore((s) => s.tenantSlug);

  useEffect(() => {
    if (initialSlug && initialSlug !== currentSlug) {
      setTenantSlug(initialSlug);
    }
  }, [initialSlug, currentSlug, setTenantSlug]);

  return (
    <div className="w-full min-h-screen pb-4 sm:pb-8 bg-surface-canvas text-text-strong">
      {/* Contenedor del Catálogo Completo */}
      <main className="max-w-[1240px] mx-auto px-3.5 sm:px-8 lg:px-12 pt-1 sm:pt-4">
        <CatalogSection tenantSlug={initialSlug} />
      </main>
    </div>
  );
}