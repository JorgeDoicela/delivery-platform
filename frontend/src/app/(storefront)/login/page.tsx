"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  LoginForm,
  RegisterForm,
  useAuthStore,
  UserRole,
  isUserInRole,
} from "@/features/auth";
import {
  ChevronRight,
  UtensilsCrossed,
  Headphones,
  FileText,
  UserCheck,
  Loader2,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useIsMounted } from "@/shared/hooks/useIsMounted";
import { useCurrentTenantQuery, RESERVED_TENANT_SLUGS } from "@/features/tenant";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

interface LoginPageProps {
  initialSlug?: string;
}

function LoginContent({ initialSlug }: LoginPageProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || undefined;
  const initialMode =
    searchParams.get("tab") === "register" || searchParams.get("mode") === "register"
      ? "register"
      : "login";
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);

  const rawSlug = pathname.split("/").filter(Boolean)[0];
  const routeSlug =
    rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
      ? rawSlug
      : undefined;

  const targetSlug = initialSlug || routeSlug;
  const { data: tenant } = useCurrentTenantQuery(targetSlug);
  const routes = useTenantRoutes(targetSlug || tenant?.slug);

  const isMounted = useIsMounted();
  const brandName = tenant?.name || (routes.isPlatformRoot ? "Mesafy" : "Restaurante");
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    router.push(routes.getLoginHref());
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* 1. Miga de Pan (Breadcrumb) */}
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
        <Link href={routes.getHomeHref()} className="hover:text-brand-primary transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-neutral-900 font-bold">Perfil</span>
      </nav>

      {/* 2. Titular Principal en Barlow Condensed */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 uppercase tracking-tight font-display">
          Hola, bienvenido/a a {brandName}
        </h1>
      </div>

      {/* 3. Cuadrícula de Dos Columnas con alineación uniforme */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch pt-2">
        {/* Columna Izquierda (en desktop) / Inferior (en móvil): Banner Promocional + Navegación Lateral */}
        <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col justify-between gap-4 h-full">
          {/* Banner de Beneficios */}
          <div className="bg-brand-primary text-white rounded-3xl p-6 shadow-sm relative overflow-hidden shrink-0">
            <span className="text-[10px] font-bold tracking-widest uppercase text-brand-accent block mb-1">
              Programa de Clientes
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight font-display leading-tight mb-2">
              Únete a Beneficios {brandName}
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-sans mb-4">
              Acumula pedidos en cada compra directa, accede a promociones exclusivas y rastrea tus despachos en tiempo real.
            </p>
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              className="bg-white text-brand-primary hover:bg-neutral-100 active:scale-95 text-xs font-black uppercase tracking-wider font-display px-5 py-2.5 rounded-full shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>{authMode === "login" ? "Crear Cuenta de Cliente" : "Ya Tengo una Cuenta"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Menú Lateral con Iconos Limpios */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-3 shadow-xs divide-y divide-neutral-100 mt-auto">
            <Link
              href={routes.getRastreoHref()}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-neutral-50 text-neutral-800 hover:text-brand-primary text-xs font-bold uppercase tracking-wider font-display transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Pedidos & Rastreo</span>
            </Link>

            <Link
              href={routes.getSucursalesHref()}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-neutral-50 text-neutral-800 hover:text-brand-primary text-xs font-bold uppercase tracking-wider font-display transition-colors"
            >
              <Headphones className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Contactos & Locales</span>
            </Link>

            <Link
              href={routes.getTermsHref()}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-neutral-50 text-neutral-800 hover:text-brand-primary text-xs font-bold uppercase tracking-wider font-display transition-colors"
            >
              <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>Términos y Condiciones</span>
            </Link>
          </div>
        </div>

        {/* Columna Derecha (en desktop) / Superior (en móvil): Tarjeta Blanca Principal de Estado / Formulario */}
        <div className="order-1 lg:order-2 lg:col-span-8 bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-10 lg:p-12 shadow-sm min-h-[380px] flex flex-col justify-center">
          {!isMounted ? (
            <div className="flex flex-col items-center justify-center p-8 text-neutral-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Verificando sesión...
              </span>
            </div>
          ) : isAuthenticated && user ? (
            /* Vista Autenticada con Perfil Activo */
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 shadow-xs">
                <UserCheck className="w-8 h-8 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-950 font-display">
                  {user.fullName}
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-mono">
                  {user.email} • Rol: <strong className="text-brand-primary uppercase">{String(user.role)}</strong>
                </p>
              </div>

              {(() => {
                const isSuperAdmin = isUserInRole(user, UserRole.SuperAdmin);
                const isTenantAdmin = isUserInRole(user, UserRole.TenantAdmin);
                const isBranchManager = isUserInRole(user, UserRole.BranchManager);
                const isCashier = isUserInRole(user, UserRole.Cashier);
                const isKitchenStaff = isUserInRole(user, UserRole.KitchenStaff);
                const isDriver = isUserInRole(user, UserRole.Driver);
                const isCustomer =
                  !isSuperAdmin &&
                  !isTenantAdmin &&
                  !isBranchManager &&
                  !isCashier &&
                  !isKitchenStaff &&
                  !isDriver;

                return (
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 pt-4 w-full sm:w-auto">
                    {/* Botones de SuperAdmin */}
                    {isSuperAdmin && (
                      <Link
                        href={routes.getSuperAdminHref()}
                        className="bg-neutral-950 hover:bg-neutral-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>Consola SuperAdmin</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Botones de TenantAdmin */}
                    {(isTenantAdmin || isSuperAdmin) && (
                      <Link
                        href={routes.getAdminHref("personalizacion")}
                        className="bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md shadow-brand-primary/20 transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>Panel de Marca & Landing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Botones de BranchManager / TenantAdmin / SuperAdmin */}
                    {(isBranchManager || isTenantAdmin || isSuperAdmin) && (
                      <>
                        <Link
                          href={routes.getAdminHref("inventario")}
                          className="bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-sm transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <span>Gestión de Inventario</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={routes.getAdminHref("sucursales")}
                          className="bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-sm transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <span>Sucursales & Horarios</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}

                    {/* Botones de Cocina KDS / Cajero */}
                    {(isKitchenStaff ||
                      isCashier ||
                      isBranchManager ||
                      isTenantAdmin ||
                      isSuperAdmin) && (
                      <Link
                        href={routes.getKitchenHref()}
                        className="bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-sm transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>Pantalla de Cocina (KDS)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Botones de Repartidor */}
                    {isDriver && (
                      <Link
                        href={routes.getDriverHref()}
                        className="bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md shadow-brand-primary/20 transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <span>Consola de Repartidor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Botones de Cliente */}
                    {isCustomer && (
                      <>
                        <Link
                          href={routes.getCatalogHref()}
                          className="bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md shadow-brand-primary/20 transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <span>Ver Menú & Pedir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={routes.getRastreoHref()}
                          className="bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-sm transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <span>Rastrear mis Pedidos</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}

                    <Link
                      href={routes.getHomeHref()}
                      className="bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-full transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                      <span>Ir a la Tienda</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-full transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Formulario de Login / Registro con Pestañas */
            <div className="w-full max-w-md mx-auto py-2">
              <div className="flex items-center p-1 bg-neutral-100 rounded-full mb-6 border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider font-display rounded-full transition-all cursor-pointer ${
                    authMode === "login"
                      ? "bg-white text-neutral-950 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider font-display rounded-full transition-all cursor-pointer ${
                    authMode === "register"
                      ? "bg-white text-neutral-950 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              <div className="mb-6 pb-3 border-b border-neutral-100">
                <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-950 font-display">
                  {authMode === "login" ? "Iniciar Sesión" : "Crear Nueva Cuenta"}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {authMode === "login"
                    ? "Accede a tu cuenta para gestionar pedidos, cocina o administración."
                    : `Regístrate en ${brandName} para disfrutar pedidos en línea y seguimiento satelital.`}
                </p>
              </div>

              {authMode === "login" ? (
                <LoginForm
                  redirectUrl={redirectUrl}
                  embedded={true}
                  onSwitchToRegister={() => setAuthMode("register")}
                />
              ) : (
                <RegisterForm
                  redirectUrl={redirectUrl}
                  embedded={true}
                  onSwitchToLogin={() => setAuthMode("login")}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ initialSlug }: LoginPageProps = {}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Cargando portal...
          </span>
        </div>
      }
    >
      <LoginContent initialSlug={initialSlug} />
    </Suspense>
  );
}
