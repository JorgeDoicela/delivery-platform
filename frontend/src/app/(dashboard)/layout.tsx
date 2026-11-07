"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Utensils,
    Volume2,
    Package,
    Building2,
    Palette,
    ShieldCheck,
    Menu,
    X,
    Store,
    ExternalLink,
} from "lucide-react";
import { UserNav, useAuthStore, UserRole, AuthGuard } from "@/features/auth";
import { TenantSwitcher, useCurrentTenantQuery, useTenantStore, RESERVED_TENANT_SLUGS } from "@/features/tenant";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isVisible: isBottomNavVisible } = useSmartScrollHeader({
        threshold: 15,
        pinThreshold: 76,
    });
    const rawSlug = pathname?.split("/").filter(Boolean)[0];
    const urlSlug =
        rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
            ? rawSlug
            : undefined;

    const tenantSlug = useTenantStore((s) => s.tenantSlug);
    const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
    const user = useAuthStore((s) => s.user);

    const activeTenantSlug = urlSlug || tenantSlug || user?.tenantSlug || "la-granjita";
    const routes = useTenantRoutes(activeTenantSlug);

    useEffect(() => {
        if (activeTenantSlug && activeTenantSlug !== tenantSlug) {
            setTenantSlug(activeTenantSlug);
        }
    }, [activeTenantSlug, tenantSlug, setTenantSlug]);

    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setIsMobileMenuOpen(false);
    }

    const { data: tenant } = useCurrentTenantQuery(activeTenantSlug);
    const isSuperAdmin = Boolean(
        user &&
        (user.role === "SuperAdmin" ||
            user.role === UserRole.SuperAdmin ||
            user.roles?.includes("SuperAdmin") ||
            Number(user.role) === 1)
    );
    const canManageFranchise =
        isSuperAdmin ||
        Boolean(
            user &&
            (user.role === "TenantAdmin" ||
                user.role === UserRole.TenantAdmin ||
                user.role === "BranchManager" ||
                user.role === UserRole.BranchManager ||
                user.roles?.includes("TenantAdmin") ||
                user.roles?.includes("BranchManager") ||
                Number(user.role) === 2 ||
                Number(user.role) === 3)
        );
    const brandName = tenant?.name || "La Granjita";
    const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

    return (
        <AuthGuard
            allowedRoles={[
                UserRole.SuperAdmin,
                UserRole.TenantAdmin,
                UserRole.BranchManager,
                UserRole.Cashier,
                UserRole.KitchenStaff,
            ]}
        >
            <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong transition-colors duration-200">
                <header className="h-16 bg-surface-card border-b border-surface-border px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs transition-colors duration-200">
                    <div className="flex items-center gap-3 sm:gap-6 min-w-0 shrink">
                        <Link href={routes.getKitchenHref()} className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink">
                            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
                                <Image
                                    src={brandLogo}
                                    alt={`Logo ${brandName}`}
                                    width={36}
                                    height={36}
                                    priority
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                            </div>
                            <div className="min-w-0">
                                <span
                                    data-display-brand
                                    className="font-black text-lg sm:text-xl tracking-tight text-text-strong block leading-none uppercase font-display truncate max-w-[120px] sm:max-w-none"
                                >
                                    {brandName}
                                </span>
                                <span className="text-[9px] sm:text-[10px] tracking-widest text-brand-primary font-bold uppercase block mt-0.5 truncate hidden xs:block">
                                    Operaciones & Cocina
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-display">
                            <Link
                                href={routes.getKitchenHref()}
                                className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${pathname.endsWith("/cocina") || pathname.endsWith("/kitchen")
                                        ? "bg-brand-primary text-white shadow-xs"
                                        : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
                                    }`}
                            >
                                <Utensils className="w-3.5 h-3.5 text-brand-primary group-hover:text-white" />
                                <span>Cocina KDS</span>
                            </Link>

                            {canManageFranchise && (
                                <>
                                    <Link
                                        href={routes.getAdminHref("inventario")}
                                        className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${pathname.includes("/admin/inventario") || pathname.includes("/admin/inventory")
                                                ? "bg-brand-primary text-white shadow-xs"
                                                : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
                                            }`}
                                    >
                                        <Package className="w-3.5 h-3.5 text-brand-accent" />
                                        <span>Inventario</span>
                                    </Link>

                                    <Link
                                        href={routes.getAdminHref("sucursales")}
                                        className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${pathname.includes("/admin/sucursales") || pathname.includes("/admin/branches")
                                                ? "bg-brand-primary text-white shadow-xs"
                                                : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
                                            }`}
                                    >
                                        <Building2 className="w-3.5 h-3.5 text-status-info" />
                                        <span>Sucursales</span>
                                    </Link>

                                    <Link
                                        href={routes.getAdminHref("personalizacion")}
                                        className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${pathname.includes("/admin/personalizacion")
                                                ? "bg-brand-primary text-white shadow-xs"
                                                : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
                                            }`}
                                    >
                                        <Palette className="w-3.5 h-3.5 text-brand-primary" />
                                        <span>Marca & Landing</span>
                                    </Link>
                                </>
                            )}

                            {isSuperAdmin && (
                                <Link
                                    href={routes.getSuperAdminHref()}
                                    className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${pathname.startsWith("/superadmin") || pathname.includes("/admin/tenants")
                                            ? "bg-brand-primary text-white shadow-xs"
                                            : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
                                        }`}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Gobernanza de Marcas</span>
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3 text-xs shrink-0">
                        {isSuperAdmin && (
                            <div className="hidden sm:block">
                                <TenantSwitcher variant="auto" />
                            </div>
                        )}

                        <div className="hidden lg:flex items-center gap-1.5 text-text-muted bg-surface-canvas px-3 py-1 rounded-full border border-surface-border text-[11px] font-bold uppercase tracking-wider">
                            <Volume2 className="w-3.5 h-3.5 text-brand-accent" />
                            <span>Alarma</span>
                        </div>

                        <Link
                            href={routes.getHomeHref()}
                            className="text-xs font-bold uppercase tracking-wider text-text-strong hover:text-brand-primary transition-colors px-2.5 sm:px-3 py-1.5 rounded-full bg-surface-canvas hover:bg-surface-card-hover border border-surface-border font-display hidden sm:inline-flex items-center gap-1.5"
                            title="Ver Tienda Pública en Vivo"
                        >
                            <Store className="w-3.5 h-3.5 text-brand-primary" />
                            <span>Ver Tienda</span>
                        </Link>

                        <ThemeToggle />

                        <UserNav />

                        {/* Botón de Menú Móvil en pantallas < md */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-1.5 rounded-full text-text-strong hover:bg-surface-card-hover md:hidden cursor-pointer shrink-0 transition-colors"
                            aria-label="Abrir navegación de operaciones"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Drawer Móvil de Operaciones */}
                {isMobileMenuOpen && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navegación de operaciones"
                        className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200"
                    >
                        <div
                            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-hidden="true"
                        />

                        <div className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-surface-card border-l border-surface-border shadow-2xl flex flex-col justify-between p-5 sm:p-6 z-10 animate-in slide-in-from-right duration-300 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="relative w-8 h-8 shrink-0">
                                            <Image
                                                src={brandLogo}
                                                alt={`Logo ${brandName}`}
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="font-display font-black text-lg uppercase tracking-tight text-text-strong block leading-none truncate">
                                                {brandName}
                                            </span>
                                            <span className="text-[9px] tracking-widest text-brand-primary font-bold uppercase block mt-0.5 truncate">
                                                Panel de Control
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors cursor-pointer shrink-0"
                                        aria-label="Cerrar menú"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {isSuperAdmin && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                                            Cambiar Marca Activa:
                                        </span>
                                        <TenantSwitcher variant="auto" />
                                    </div>
                                )}

                                <nav className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block px-3 py-1">
                                        Módulos Operativos
                                    </span>

                                    <Link
                                        href={routes.getKitchenHref()}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-display font-black text-sm uppercase tracking-wide transition-colors ${pathname.endsWith("/cocina") || pathname.endsWith("/kitchen")
                                                ? "bg-brand-primary text-white shadow-xs"
                                                : "text-text-strong hover:bg-surface-canvas hover:text-brand-primary"
                                            }`}
                                    >
                                        <Utensils className="w-4 h-4 text-brand-primary shrink-0" />
                                        <span>Cocina KDS</span>
                                    </Link>

                                    {canManageFranchise && (
                                        <>
                                            <Link
                                                href={routes.getAdminHref("inventario")}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-display font-black text-sm uppercase tracking-wide transition-colors ${pathname.includes("/admin/inventario") || pathname.includes("/admin/inventory")
                                                        ? "bg-brand-primary text-white shadow-xs"
                                                        : "text-text-strong hover:bg-surface-canvas hover:text-brand-primary"
                                                    }`}
                                            >
                                                <Package className="w-4 h-4 text-brand-accent shrink-0" />
                                                <span>Inventario & Platos</span>
                                            </Link>

                                            <Link
                                                href={routes.getAdminHref("sucursales")}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-display font-black text-sm uppercase tracking-wide transition-colors ${pathname.includes("/admin/sucursales") || pathname.includes("/admin/branches")
                                                        ? "bg-brand-primary text-white shadow-xs"
                                                        : "text-text-strong hover:bg-surface-canvas hover:text-brand-primary"
                                                    }`}
                                            >
                                                <Building2 className="w-4 h-4 text-status-info shrink-0" />
                                                <span>Sucursales & Horarios</span>
                                            </Link>

                                            <Link
                                                href={routes.getAdminHref("personalizacion")}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-display font-black text-sm uppercase tracking-wide transition-colors ${pathname.includes("/admin/personalizacion")
                                                        ? "bg-brand-primary text-white shadow-xs"
                                                        : "text-text-strong hover:bg-surface-canvas hover:text-brand-primary"
                                                    }`}
                                            >
                                                <Palette className="w-4 h-4 text-brand-primary shrink-0" />
                                                <span>Marca & Landing</span>
                                            </Link>
                                        </>
                                    )}

                                    {isSuperAdmin && (
                                        <Link
                                            href={routes.getSuperAdminHref()}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-display font-black text-sm uppercase tracking-wide transition-colors ${pathname.startsWith("/superadmin") || pathname.includes("/admin/tenants")
                                                    ? "bg-brand-primary text-white shadow-xs"
                                                    : "text-text-strong hover:bg-surface-canvas hover:text-brand-primary"
                                                }`}
                                        >
                                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Gobernanza de Marcas</span>
                                        </Link>
                                    )}
                                </nav>
                            </div>

                            <div className="pt-6 border-t border-surface-border space-y-3">
                                <Link
                                    href={`/${tenant?.slug || "la-granjita"}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs font-bold uppercase tracking-wider font-display transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Store className="w-4 h-4 text-brand-primary" />
                                        <span>Ver Tienda Pública</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                                </Link>

                                <div className="flex items-center justify-between px-2 pt-1">
                                    <span className="text-[11px] text-text-muted font-medium">Tema:</span>
                                    <ThemeToggle />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto overflow-x-hidden flex flex-col bg-surface-canvas transition-colors duration-200 pb-20 md:pb-6">
                    {children}
                </main>

                {/* Barra de Navegación Inferior Móvil para Dashboard (< md) */}
                <nav
                    aria-label="Navegación móvil de operaciones"
                    className={`fixed bottom-0 left-0 right-0 z-30 bg-surface-card/95 backdrop-blur-md border-t border-surface-border px-1.5 py-1.5 flex items-center justify-around md:hidden shadow-lg select-none transition-all duration-300 ease-in-out ${isBottomNavVisible
                            ? "translate-y-0 opacity-100 pointer-events-auto"
                            : "translate-y-full opacity-0 pointer-events-none"
                        }`}
                    style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
                >
                    <Link
                        href={`/${activeTenantSlug}/cocina`}
                        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${pathname.endsWith("/cocina") || pathname.endsWith("/kitchen")
                                ? "text-brand-primary"
                                : "text-text-muted hover:text-text-strong"
                            }`}
                    >
                        <Utensils className="w-5 h-5 mb-0.5" />
                        <span>KDS</span>
                    </Link>

                    {canManageFranchise && (
                        <>
                            <Link
                                href={routes.getAdminHref("inventario")}
                                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${pathname.includes("/admin/inventario") || pathname.includes("/admin/inventory")
                                        ? "text-brand-primary"
                                        : "text-text-muted hover:text-text-strong"
                                    }`}
                            >
                                <Package className="w-5 h-5 mb-0.5" />
                                <span>Stock</span>
                            </Link>

                            <Link
                                href={routes.getAdminHref("sucursales")}
                                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${pathname.includes("/admin/sucursales") || pathname.includes("/admin/branches")
                                        ? "text-brand-primary"
                                        : "text-text-muted hover:text-text-strong"
                                    }`}
                            >
                                <Building2 className="w-5 h-5 mb-0.5" />
                                <span>Locales</span>
                            </Link>

                            <Link
                                href={routes.getAdminHref("personalizacion")}
                                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${pathname.includes("/admin/personalizacion")
                                        ? "text-brand-primary"
                                        : "text-text-muted hover:text-text-strong"
                                    }`}
                            >
                                <Palette className="w-5 h-5 mb-0.5" />
                                <span>Marca</span>
                            </Link>
                        </>
                    )}

                    {isSuperAdmin && (
                        <Link
                            href={routes.getSuperAdminHref()}
                            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${pathname.startsWith("/superadmin") || pathname.includes("/admin/tenants")
                                    ? "text-brand-primary"
                                    : "text-text-muted hover:text-text-strong"
                                }`}
                        >
                            <ShieldCheck className="w-5 h-5 mb-0.5" />
                            <span>Admin</span>
                        </Link>
                    )}

                    <Link
                        href={`/${tenant?.slug || "la-granjita"}`}
                        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider text-text-muted hover:text-text-strong transition-colors min-w-[50px] min-h-[44px]"
                    >
                        <Store className="w-5 h-5 mb-0.5" />
                        <span>Tienda</span>
                    </Link>
                </nav>
            </div>
        </AuthGuard>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
    );
}
