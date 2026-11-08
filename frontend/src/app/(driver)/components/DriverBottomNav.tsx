"use client";

import React from "react";
import Link from "next/link";
import { PackageCheck, ChefHat, BarChart3, Store } from "lucide-react";
import { useDriverStore } from "@/features/tracking/store/useDriverStore";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";

interface DriverBottomNavProps {
  routes: TenantRoutingResolution;
}

export function DriverBottomNav({ routes }: DriverBottomNavProps) {
  const activeTab = useDriverStore((s) => s.activeTab);
  const setActiveTab = useDriverStore((s) => s.setActiveTab);
  const activeOrders = useDriverStore((s) => s.activeOrders);
  const availableOrders = useDriverStore((s) => s.availableOrders);

  const activeCount = activeOrders.length;
  const availableCount = availableOrders.length;

  return (
    <nav
      aria-label="Navegación móvil del repartidor"
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface-card/95 backdrop-blur-md border-t border-surface-border px-1.5 py-1.5 flex items-center justify-around sm:hidden shadow-lg select-none transition-all duration-300 ease-in-out"
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={() => setActiveTab("active")}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[60px] min-h-[44px] cursor-pointer relative ${
          activeTab === "active"
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <div className="relative">
          <PackageCheck className="w-5 h-5 mb-0.5" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-brand-primary text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
              {activeCount}
            </span>
          )}
        </div>
        <span>En Ruta</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("available")}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[60px] min-h-[44px] cursor-pointer relative ${
          activeTab === "available"
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <div className="relative">
          <ChefHat className="w-5 h-5 mb-0.5" />
          {availableCount > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-status-warning text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
              {availableCount}
            </span>
          )}
        </div>
        <span>Cocina</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("shift")}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[60px] min-h-[44px] cursor-pointer ${
          activeTab === "shift"
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span>Mi Turno</span>
      </button>

      <Link
        href={routes.getHomeHref()}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider text-text-muted hover:text-text-strong transition-colors min-w-[60px] min-h-[44px]"
      >
        <Store className="w-5 h-5 mb-0.5" />
        <span>Tienda</span>
      </Link>
    </nav>
  );
}
