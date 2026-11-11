"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    LoginForm,
    RegisterForm,
    ForgotPasswordForm,
    ResetPasswordForm,
    VerifyEmailView,
    useAuthStore,
    resolvePostLoginRedirect,
} from "@/features/auth";
import {
    Loader2,
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

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 min-h-[100dvh] mb-16 sm:mb-24">
            {/* 1. Titular Principal en Barlow Condensed */}
            <div className="text-center sm:text-left space-y-1">
                <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-tight font-display">
                    {isAuthenticated && user && authMode !== "verify-email"
                        ? "Accediendo a tu cuenta"
                        : `Hola, bienvenido/a a ${brandName}`}
                </h1>
            </div>

            {/* 2. Tarjeta Blanca Principal de Estado / Formulario */}
            <div className="bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-10 lg:p-12 shadow-sm min-h-[380px] flex flex-col justify-center text-text-strong">
                {!isMounted ? (
                    <div className="flex flex-col items-center justify-center p-8 text-text-muted gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Verificando sesión...
                        </span>
                    </div>
                ) : isAuthenticated && user && authMode !== "verify-email" ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
                        <p className="text-base font-bold text-text-strong font-display uppercase tracking-wider">
                            Iniciando sesión...
                        </p>
                        <p className="text-xs text-text-muted">
                            Redirigiendo a tu espacio personal
                        </p>
                    </div>
                ) : (
                    /* Formulario de Login / Registro / Recuperación */
                    <div className="w-full max-w-md mx-auto py-2">
                        <div className="mb-6 pb-3 border-b border-surface-border/60">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display">
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
                            <p className="text-xs text-text-muted mt-1">
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
                <div className="flex flex-col items-center justify-center min-h-[100dvh] text-neutral-500 gap-2 mb-16 sm:mb-24">
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
