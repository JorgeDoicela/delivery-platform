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
  resolvePostLoginRedirect,
} from "@/features/auth";
import {
  Loader2,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Mail,
  CheckCircle2,
  User,
  ShoppingBag,
  Compass,
  ChefHat,
  Truck,
  LayoutDashboard,
  Store,
} from "lucide-react";
import { useIsMounted } from "@/shared/hooks/useIsMounted";
import { useCurrentTenantQuery, RESERVED_TENANT_SLUGS } from "@/features/tenant";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { getApiBaseUrl } from "@/shared/lib/api-client";

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
  const [activeEmail] = useState(emailParam);
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

  // Si el usuario ya está autenticado y no está en modo de verificación de correo,
  // redirigir automáticamente a su destino natural (su cuenta o redirectUrl).
  useEffect(() => {
    if (isMounted && isAuthenticated && user && authMode !== "verify-email") {
      const destination = resolvePostLoginRedirect({
        user,
        redirectUrl,
        routing: routes,
      });
      router.replace(destination);
    }
  }, [isMounted, isAuthenticated, user, authMode, redirectUrl, routes, router]);

  const handleLogout = async () => {
    await logout();
    router.push(routes.getLoginHref());
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* 1. Titular Principal en Barlow Condensed */}
      <div className="text-center sm:text-left space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block">
          {isAuthenticated && user && authMode !== "verify-email"
            ? "Sesión de Usuario Activa"
            : "Acceso Seguro"}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 uppercase tracking-tight font-display">
          {isAuthenticated && user && authMode !== "verify-email"
            ? `Tu Cuenta en ${brandName}`
            : `Hola, bienvenido/a a ${brandName}`}
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
            (() => {
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

              const staffRoleLabel = isSuperAdmin
                ? "Super Administrador"
                : isTenantAdmin
                  ? "Administrador"
                  : isBranchManager
                    ? "Gerente de Sucursal"
                    : isKitchenStaff
                      ? "Personal de Cocina"
                      : isCashier
                        ? "Cajero"
                        : isDriver
                          ? "Repartidor"
                          : null;

              return (
                <div className="space-y-6">
                  {/* Encabezado de Usuario Activo */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-neutral-100">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-black text-2xl font-display shadow-sm shrink-0 overflow-hidden border border-neutral-200">
                      {user.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={
                            user.avatarUrl.startsWith("http")
                              ? user.avatarUrl
                              : `${getApiBaseUrl()}${user.avatarUrl.startsWith("/") ? user.avatarUrl : `/${user.avatarUrl}`}`
                          }
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : user.fullName ? (
                        user.fullName.charAt(0).toUpperCase()
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-2xl font-black text-neutral-950 font-display tracking-tight">
                          {user.fullName || "Cliente"}
                        </h2>
                        {user.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verificado</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Sin verificar
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-mono">
                        {user.email}
                        {!isCustomer && staffRoleLabel && (
                          <span className="ml-2 font-sans font-bold text-neutral-700">
                            • Cargo: <span className="text-brand-primary">{staffRoleLabel}</span>
                          </span>
                        )}
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-neutral-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                        <span>Redirigiendo a tu espacio personal... o selecciona una opción:</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de correo no verificado si aplica */}
                  {!user.isEmailVerified && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                      <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Correo pendiente de verificación</p>
                        <p className="text-amber-800">
                          Te enviamos un enlace de activación a tu correo al momento del registro.
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

                  {/* Cuadrícula de Acciones Rápidas (Quick Actions Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Tarjeta Mi Cuenta */}
                    <Link
                      href={routes.getAccountHref()}
                      className="group bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-brand-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 group-hover:bg-brand-primary group-hover:text-white group-hover:border-transparent transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-neutral-950 font-display text-lg uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                            Mi Cuenta & Perfil
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            Gestiona tus pedidos, direcciones de entrega guardadas y seguridad.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-brand-primary uppercase tracking-wider font-display pt-2 border-t border-neutral-100">
                        <span>Ir al portal</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Tarjeta Menú & Pedidos */}
                    <Link
                      href={routes.getCatalogHref()}
                      className="group bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-brand-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 group-hover:bg-brand-primary group-hover:text-white group-hover:border-transparent transition-colors">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-neutral-950 font-display text-lg uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                            Ver Menú & Pedir
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            Explora platos, combos familiares y promociones activas de {brandName}.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-brand-primary uppercase tracking-wider font-display pt-2 border-t border-neutral-100">
                        <span>Explorar carta</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Tarjeta Rastreo */}
                    <Link
                      href={routes.getRastreoHref()}
                      className="group bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-brand-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 group-hover:bg-brand-primary group-hover:text-white group-hover:border-transparent transition-colors">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-neutral-950 font-display text-lg uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                            Rastreo Satelital
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            Seguimiento en tiempo real de tus pedidos en preparación y entrega.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-brand-primary uppercase tracking-wider font-display pt-2 border-t border-neutral-100">
                        <span>Consultar estado</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Tarjetas adicionales para Staff Operativo */}
                    {isSuperAdmin && (
                      <Link
                        href={routes.getSuperAdminHref()}
                        className="group bg-neutral-950 text-white rounded-2xl p-5 shadow-sm hover:bg-neutral-900 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <LayoutDashboard className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-white font-display text-lg uppercase tracking-tight">
                              Consola SuperAdmin
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1">
                              Gestión global de inquilinos, métricas y suscripciones.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-white uppercase tracking-wider font-display pt-2 border-t border-white/10">
                          <span>Entrar a consola</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )}

                    {(isTenantAdmin || isBranchManager) && (
                      <Link
                        href={routes.getAdminHref("personalizacion")}
                        className="group bg-neutral-900 text-white rounded-2xl p-5 shadow-sm hover:bg-neutral-800 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-white font-display text-lg uppercase tracking-tight">
                              Panel de Restaurante
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1">
                              Inventario, sucursales y personalización de marca.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-white uppercase tracking-wider font-display pt-2 border-t border-white/10">
                          <span>Gestionar negocio</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )}

                    {(isKitchenStaff || isCashier) && (
                      <Link
                        href={routes.getKitchenHref()}
                        className="group bg-neutral-900 text-white rounded-2xl p-5 shadow-sm hover:bg-neutral-800 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <ChefHat className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-white font-display text-lg uppercase tracking-tight">
                              Pantalla Cocina KDS
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1">
                              Comandas en tiempo real, tiempos de cocción y audio de avisos.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-white uppercase tracking-wider font-display pt-2 border-t border-white/10">
                          <span>Abrir KDS</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )}

                    {isDriver && (
                      <Link
                        href={routes.getDriverHref()}
                        className="group bg-neutral-900 text-white rounded-2xl p-5 shadow-sm hover:bg-neutral-800 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-white font-display text-lg uppercase tracking-tight">
                              Consola de Repartidor
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1">
                              Rutas activas, telemetría GPS y confirmación de entrega.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-white uppercase tracking-wider font-display pt-2 border-t border-white/10">
                          <span>Iniciar entregas</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Barra Inferior de Navegación & Logout */}
                  <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <Link
                      href={routes.getHomeHref()}
                      className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-950 font-bold transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver a la portada de {brandName}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-red-600 font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar sesión activa</span>
                    </button>
                  </div>
                </div>
              );
            })()
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
                />
              )}

              {authMode === "reset-password" && (
                <ResetPasswordForm
                  embedded={true}
                  initialEmail={activeEmail}
                  initialToken={activeToken}
                  onSwitchToLogin={() => setAuthMode("login")}
                  onSwitchToForgotPassword={() => setAuthMode("forgot-password")}
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
