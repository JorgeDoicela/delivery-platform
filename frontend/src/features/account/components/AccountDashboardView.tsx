"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  Shield,
  Lock,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Select, type SelectOption } from "@/shared/components/Select";
import { useAccountStore, type AccountTab } from "../store/useAccountStore";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { AccountHeader } from "./AccountHeader";
import { AccountProfileSection } from "./AccountProfileSection";
import { AccountOrdersSection } from "./AccountOrdersSection";
import { AccountAddressesSection } from "./AccountAddressesSection";
import { AccountPrivacySection } from "./AccountPrivacySection";
import { AccountSecuritySection } from "./AccountSecuritySection";

interface AccountDashboardViewProps {
  tenantSlug?: string;
}

const TABS: Array<{ id: AccountTab; label: string; icon: typeof User }> = [
  { id: "perfil", label: "Datos Personales", icon: User },
  { id: "pedidos", label: "Historial de Pedidos", icon: Package },
  { id: "direcciones", label: "Direcciones Guardadas", icon: MapPin },
  { id: "privacidad", label: "Privacidad (LOPDP)", icon: Shield },
  { id: "seguridad", label: "Seguridad y Clave", icon: Lock },
];

const TAB_OPTIONS: SelectOption<AccountTab>[] = TABS.map((tab) => ({
  value: tab.id,
  label: tab.label,
  icon: tab.icon,
}));

export function AccountDashboardView({ tenantSlug }: AccountDashboardViewProps) {
  const router = useRouter();
  const profile = useAccountStore((s) => s.profile);
  const activeTab = useAccountStore((s) => s.activeTab);
  const isLoadingProfile = useAccountStore((s) => s.isLoadingProfile);
  const setActiveTab = useAccountStore((s) => s.setActiveTab);
  const fetchProfile = useAccountStore((s) => s.fetchProfile);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  const handleLogout = async () => {
    await logout();
    if (tenantSlug) {
      router.push(`/${tenantSlug}/login`);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header Principal del Usuario */}
      <AccountHeader profile={profile} isLoading={isLoadingProfile} />

      {/* Grid: Navegación de pestañas + Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Navegación Responsive: Selector táctil en móvil, flex-wrap en tablet, Sidebar vertical en desktop */}
        <aside className="lg:col-span-1 space-y-3">
          {/* Versión Móvil (< 640px): Selector de secciones a ancho completo */}
          <div className="sm:hidden w-full">
            <Select<AccountTab>
              options={TAB_OPTIONS}
              value={activeTab}
              onChange={(val) => setActiveTab(val)}
              size="md"
              variant="surface"
              triggerClassName="!min-h-[50px] shadow-xs"
              placeholder="Seleccionar sección..."
              id="account-tab-select"
            />
          </div>

          {/* Versión Tablet (640px a 1024px): Píldoras con wrap automático y botón Cerrar Sesión */}
          <nav className="hidden sm:flex lg:hidden flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 flex-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                      isActive
                        ? "bg-brand-primary text-white shadow-xs font-display uppercase tracking-wider"
                        : "bg-surface-card border border-surface-border text-text-strong hover:bg-surface-canvas active:scale-95"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-surface-card border border-surface-border text-text-muted hover:text-brand-primary hover:bg-surface-canvas active:scale-95 transition-all min-h-[44px] cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>

          {/* Versión Desktop (>= 1024px): Menú lateral estructurado */}
          <nav className="hidden lg:block bg-surface-card border border-surface-border rounded-3xl p-3 space-y-1 shadow-xs sticky top-24">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    isActive
                      ? "bg-brand-primary text-white shadow-xs font-display uppercase tracking-wider"
                      : "text-text-muted hover:text-text-strong hover:bg-surface-canvas"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? "text-white" : "text-text-subtle"
                    }`}
                  />
                </button>
              );
            })}

            <div className="pt-2 border-t border-surface-border mt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-text-muted hover:text-brand-primary hover:bg-surface-canvas transition-colors min-h-[44px] cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Panel Central Dinámico */}
        <main className="lg:col-span-3 space-y-6">
          {activeTab === "perfil" && <AccountProfileSection />}
          {activeTab === "pedidos" && <AccountOrdersSection />}
          {activeTab === "direcciones" && <AccountAddressesSection />}
          {activeTab === "privacidad" && <AccountPrivacySection />}
          {activeTab === "seguridad" && <AccountSecuritySection />}

          {/* Botón de Cierre de Sesión visible al final en Móvil y Tablet */}
          <div className="pt-6 border-t border-surface-border lg:hidden flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-card border border-surface-border text-xs font-bold uppercase tracking-wider font-display text-text-muted hover:text-brand-primary hover:bg-surface-canvas active:scale-95 transition-all min-h-[48px] shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-brand-primary" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

