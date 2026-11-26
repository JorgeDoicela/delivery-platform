"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  Shield,
  Lock,
  LogOut,
} from "lucide-react";
import { Select, type SelectOption } from "@/shared/components/Select";
import { useAccountStore, type AccountTab } from "../store/useAccountStore";
import { useAuthStore, UserRole, isUserInRole } from "@/features/auth";
import { useCurrentTenantQuery } from "@/features/tenant";
import { AccountHeader } from "./AccountHeader";
import { AccountProfileSection } from "./AccountProfileSection";
import { AccountOrdersSection } from "./AccountOrdersSection";
import { AccountAddressesSection } from "./AccountAddressesSection";
import { AccountPrivacySection } from "./AccountPrivacySection";
import { AccountSecuritySection } from "./AccountSecuritySection";

interface AccountDashboardViewProps {
  tenantSlug?: string;
}

const ALL_TABS: Array<{
  id: AccountTab;
  label: string;
  icon: typeof User;
  customerOnly?: boolean;
}> = [
  { id: "perfil", label: "Datos Personales", icon: User },
  { id: "pedidos", label: "Historial de Pedidos", icon: Package, customerOnly: true },
  { id: "direcciones", label: "Direcciones Guardadas", icon: MapPin, customerOnly: true },
  { id: "privacidad", label: "Privacidad (LOPDP)", icon: Shield },
  { id: "seguridad", label: "Seguridad y Clave", icon: Lock },
];

export function AccountDashboardView({ tenantSlug }: AccountDashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") as AccountTab | null;

  const profile = useAccountStore((s) => s.profile);
  const activeTab = useAccountStore((s) => s.activeTab);
  const isLoadingProfile = useAccountStore((s) => s.isLoadingProfile);
  const setActiveTab = useAccountStore((s) => s.setActiveTab);
  const fetchProfile = useAccountStore((s) => s.fetchProfile);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { data: tenant } = useCurrentTenantQuery(tenantSlug);
  const allowCustomBilling = tenant?.allowCustomBilling ?? true;

  const isStaffOrAdmin =
    isUserInRole(user, UserRole.SuperAdmin) ||
    isUserInRole(user, UserRole.TenantAdmin) ||
    isUserInRole(user, UserRole.BranchManager) ||
    isUserInRole(user, UserRole.KitchenStaff) ||
    isUserInRole(user, UserRole.Cashier) ||
    isUserInRole(user, UserRole.Driver);

  const visibleTabs = isStaffOrAdmin
    ? ALL_TABS.filter((tab) => !tab.customerOnly)
    : ALL_TABS;

  const tabOptions: SelectOption<AccountTab>[] = visibleTabs.map((tab) => ({
    value: tab.id,
    label: tab.label,
    icon: tab.icon,
  }));

  useEffect(() => {
    if (
      tabParam &&
      visibleTabs.some((t) => t.id === tabParam)
    ) {
      setActiveTab(tabParam);
    } else if (
      isStaffOrAdmin &&
      (activeTab === "pedidos" || activeTab === "direcciones")
    ) {
      setActiveTab("perfil");
    }
  }, [tabParam, isStaffOrAdmin, activeTab, visibleTabs, setActiveTab]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
      {/* Contenedor Maestro Unificado */}
      <div className="bg-surface-card border border-surface-border rounded-3xl shadow-xs overflow-hidden">
        {/* Header Principal del Usuario */}
        <AccountHeader profile={profile} isLoading={isLoadingProfile} />

        {/* Cuerpo: Navegación de pestañas + Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          {/* Navegación Responsive: Selector táctil en móvil, píldoras en tablet, Sidebar integrado en desktop */}
          <aside className="border-b lg:border-b-0 lg:border-r border-surface-border bg-surface-canvas/40">
            {/* Versión Móvil (< 640px): Selector de secciones a ancho completo */}
            <div className="sm:hidden p-4 w-full">
              <Select<AccountTab>
                options={tabOptions}
                value={activeTab}
                onChange={(val) => setActiveTab(val)}
                size="md"
                variant="surface"
                triggerClassName="!min-h-[46px]"
                placeholder="Seleccionar sección..."
                id="account-tab-select"
              />
            </div>

            {/* Versión Tablet (640px a 1024px): Píldoras con wrap automático y botón Cerrar Sesión */}
            <nav
              aria-label="Secciones de cuenta"
              className="hidden sm:flex lg:hidden flex-wrap items-center justify-between gap-2 p-4"
            >
              <div className="flex flex-wrap gap-2 flex-1">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                        isActive
                          ? "bg-surface-card text-text-strong ring-1 ring-surface-border shadow-xs"
                          : "text-text-muted hover:text-text-strong hover:bg-surface-card/70"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-brand-primary" : "text-text-subtle"
                        }`}
                      />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold text-text-muted hover:text-brand-primary hover:bg-surface-card transition-colors min-h-[40px] cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Cerrar Sesión</span>
              </button>
            </nav>

            {/* Versión Desktop (>= 1024px): Menú lateral integrado con jerarquía limpia */}
            <nav
              aria-label="Navegación de cuenta"
              className="hidden lg:flex lg:flex-col h-full justify-between p-4"
            >
              <div className="space-y-1">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all min-h-[44px] cursor-pointer text-left ${
                        isActive
                          ? "bg-surface-card text-text-strong font-bold shadow-2xs ring-1 ring-surface-border"
                          : "text-text-muted font-medium hover:text-text-strong hover:bg-surface-card/70"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-brand-primary" : "text-text-subtle"
                        }`}
                      />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-surface-border mt-6">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-text-muted hover:text-brand-primary hover:bg-surface-card transition-colors min-h-[44px] cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Panel Central Dinámico */}
          <main className="p-6 sm:p-8 lg:p-10 min-w-0 space-y-6">
            {activeTab === "perfil" && (
              <AccountProfileSection allowCustomBilling={allowCustomBilling} />
            )}
            {activeTab === "pedidos" && <AccountOrdersSection />}
            {activeTab === "direcciones" && <AccountAddressesSection />}
            {activeTab === "privacidad" && <AccountPrivacySection />}
            {activeTab === "seguridad" && (
              <AccountSecuritySection allowCustomBilling={allowCustomBilling} />
            )}

            {/* Botón de Cierre de Sesión visible al final en Móvil y Tablet */}
            <div className="pt-6 border-t border-surface-border lg:hidden flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-bold uppercase tracking-wider font-display text-text-muted hover:text-brand-primary hover:bg-surface-card-hover active:scale-95 transition-all min-h-[48px] cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-brand-primary" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

