"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  VerifyEmailView,
  useAuthStore,
  UserRole,
  isUserInRole,
} from "@/features/auth";
import {
  UserCheck,
  Loader2,
  LogOut,
  ArrowRight,
  Mail,
  CheckCircle2,
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
  const tabParam = searchParams.get("tab") || searchParams.get("mode") || "";
  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const isVerifyEmail =
    tabParam === "verify-email" ||
    (Boolean(tokenParam) && tabParam !== "reset-password");

  const initialMode =
    isVerifyEmail
      ? "verify-email"
      : tokenParam || tabParam === "reset-password"
        ? "reset-password"
        : tabParam === "forgot-password"
          ? "forgot-password"
          : tabParam === "register"
            ? "register"
            : "login";

  const [authMode, setAuthMode] = useState<
    "login" | "register" | "forgot-password" | "reset-password" | "verify-email"
  >(initialMode);
  const [activeEmail, setActiveEmail] = useState(emailParam);
  const [activeToken] = useState(tokenParam);

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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* 1. Titular Principal en Barlow Condensed */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 uppercase tracking-tight font-display">
          Hola, bienvenido/a a {brandName}
        </h1>
      </div>

      {/* 2. Tarjeta Blanca Principal de Estado / Formulario */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-10 lg:p-12 shadow-sm min-h-[380px] flex flex-col justify-center">
        {!isMounted ? (
            <div className="flex flex-col items-center justify-center p-8 text-neutral-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Verificando sesión...
              </span>
            </div>
          ) : isAuthenticated && user && authMode !== "verify-email" ? (
            /* Vista Autenticada con Perfil Activo */
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 shadow-xs">
                <UserCheck className="w-8 h-8 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-950 font-display">
                  {user.fullName}
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-mono inline-flex items-center gap-1.5 flex-wrap justify-center">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>Rol: <strong className="text-brand-primary uppercase">{String(user.role)}</strong></span>
                  <span>•</span>
                  {user.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verificado</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500 font-bold">
                      Sin verificar
                    </span>
                  )}
                </p>
              </div>

              {!user.isEmailVerified && (
                <div className="w-full max-w-md mx-auto p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-800 text-left flex items-start gap-3 shadow-xs">
                  <Mail className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Correo pendiente de verificación</p>
                    <p className="text-neutral-600">
                      Te enviamos un correo con un enlace de activación al registrarte.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAuthMode("verify-email")}
                      className="text-brand-primary font-bold hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Validar código o reenviar enlace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

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
            /* Formulario de Login / Registro / Recuperación */
            <div className="w-full max-w-md mx-auto py-2">
              <div className="mb-6 pb-3 border-b border-neutral-100">
                <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-950 font-display">
                  {authMode === "login"
                    ? "Iniciar Sesión"
                    : authMode === "register"
                      ? "Crear Nueva Cuenta"
                      : authMode === "forgot-password"
                        ? "Recuperar Contraseña"
                        : authMode === "reset-password"
                          ? "Restablecer Contraseña"
                          : "Verificar Correo Electrónico"}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {authMode === "login"
                    ? "Accede a tu cuenta para gestionar pedidos, cocina o administración."
                    : authMode === "register"
                      ? `Regístrate en ${brandName} para disfrutar pedidos en línea y seguimiento satelital.`
                      : authMode === "forgot-password"
                        ? "Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro con instrucciones."
                        : authMode === "reset-password"
                          ? "Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta."
                          : `Confirma tu cuenta registrada en ${brandName} para habilitar pedidos y notificaciones.`}
                </p>
              </div>

              {authMode === "login" && (
                <LoginForm
                  redirectUrl={redirectUrl}
                  embedded={true}
                  onSwitchToRegister={() => setAuthMode("register")}
                  onSwitchToForgotPassword={() => setAuthMode("forgot-password")}
                />
              )}

              {authMode === "register" && (
                <RegisterForm
                  redirectUrl={redirectUrl}
                  embedded={true}
                  onSwitchToLogin={() => setAuthMode("login")}
                />
              )}

              {authMode === "forgot-password" && (
                <ForgotPasswordForm
                  embedded={true}
                  onSwitchToLogin={() => setAuthMode("login")}
                  onSwitchToReset={(email) => {
                    setActiveEmail(email);
                    setAuthMode("reset-password");
                  }}
                />
              )}

              {authMode === "reset-password" && (
                <ResetPasswordForm
                  embedded={true}
                  initialEmail={activeEmail}
                  initialToken={activeToken}
                  onSwitchToLogin={() => setAuthMode("login")}
                />
              )}

              {authMode === "verify-email" && (
                <VerifyEmailView
                  embedded={true}
                  initialToken={activeToken}
                  initialEmail={activeEmail || user?.email}
                  onSwitchToLogin={() => setAuthMode("login")}
                />
              )}
            </div>
          )}
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
