"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginForm, useAuthStore } from "@/features/auth";
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
import { useCurrentTenantQuery } from "@/features/tenant";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || undefined;

  const isMounted = useIsMounted();
  const { data: tenant } = useCurrentTenantQuery();
  const brandName = tenant?.name || "Mesafy";
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* 1. Miga de Pan (Breadcrumb estilo KFC) */}
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
        <Link href={tenant?.slug ? `/${tenant.slug}` : "/"} className="hover:text-brand-primary transition-colors">
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

      {/* 3. Cuadrícula de Dos Columnas estilo KFC con alineación uniforme */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch pt-2">
        {/* Columna Izquierda: Banner Promocional + Navegación Lateral alineada abajo */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4 h-full">
          {/* Banner de Beneficios */}
          <div className="bg-brand-primary text-white rounded-3xl p-6 shadow-sm relative overflow-hidden shrink-0">
            <span className="text-[10px] font-bold tracking-widest uppercase text-brand-accent block mb-1">
              Programa de Clientes
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight font-display leading-tight mb-2">
              Únete a Beneficios {brandName}
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-sans">
              Acumula pedidos en cada compra directa, accede a promociones exclusivas y rastrea tus despachos en tiempo real.
            </p>
          </div>

          {/* Menú Lateral con Iconos Limpios (Alineado al fondo al ras de la tarjeta derecha) */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-3 shadow-xs divide-y divide-neutral-100 mt-auto">
            <Link
              href="/rastreo"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-neutral-50 text-neutral-800 hover:text-brand-primary text-xs font-bold uppercase tracking-wider font-display transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Pedidos & Rastreo</span>
            </Link>

            <Link
              href="/sucursales"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-neutral-50 text-neutral-800 hover:text-brand-primary text-xs font-bold uppercase tracking-wider font-display transition-colors"
            >
              <Headphones className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Contactos & Locales</span>
            </Link>

            <Link
              href="/terminos"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-neutral-50 text-neutral-800 hover:text-brand-primary text-xs font-bold uppercase tracking-wider font-display transition-colors"
            >
              <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>Términos y Condiciones</span>
            </Link>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Blanca Principal de Estado / Formulario */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-10 lg:p-12 shadow-sm min-h-[380px] flex flex-col justify-center">
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

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 pt-4 w-full sm:w-auto">
                {(user.role === "SuperAdmin" || Number(user.role) === 1) && (
                  <Link
                    href="/superadmin"
                    className="bg-neutral-950 hover:bg-neutral-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Consola SuperAdmin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {(user.role === "TenantAdmin" ||
                  user.role === "SuperAdmin" ||
                  Number(user.role) === 2 ||
                  Number(user.role) === 1) && (
                  <Link
                    href="/admin/personalizacion"
                    className="bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md shadow-brand-primary/20 transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Panel de Marca</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {(user.role === "Driver" || Number(user.role) === 6) && (
                  <Link
                    href={`/${user.tenantSlug || tenant?.slug || "la-granjita"}/repartidor`}
                    className="bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md shadow-brand-primary/20 transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Ir a Reparto Móvil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {(user.role === "KitchenStaff" ||
                  user.role === "SuperAdmin" ||
                  user.role === "TenantAdmin" ||
                  Number(user.role) === 5 ||
                  Number(user.role) === 1 ||
                  Number(user.role) === 2) && (
                  <Link
                    href={`/${user.tenantSlug || tenant?.slug || "la-granjita"}/cocina`}
                    className="bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-sm transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Ir a Cocina KDS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Login Directo */
            <div className="w-full max-w-md mx-auto py-2">
              <div className="mb-6 pb-3 border-b border-neutral-100">
                <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-950 font-display">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Accede a tu cuenta para gestionar pedidos, cocina o administración.
                </p>
              </div>

              <LoginForm redirectUrl={redirectUrl} embedded={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
