"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth";
import { useTenantStore } from "@/features/tenant";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { Lock, UserPlus, LogIn, AlertCircle, Loader2 } from "lucide-react";

export function CheckoutAuthGate() {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Estados de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Estados de Registro
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [localError, setLocalError] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);
  const registerUser = useAuthStore((s) => s.register);
  const authLoading = useAuthStore((s) => s.status === "loading");
  const tenantSlug = useTenantStore((s) => s.tenantSlug);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLocalError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      await login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Credenciales inválidas.";
      setLocalError(msg);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!registerName.trim() || !registerPhone.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setLocalError("Todos los campos son obligatorios para crear tu cuenta.");
      return;
    }

    if (registerPassword.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await registerUser({
        fullName: registerName.trim(),
        phone: registerPhone.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        tenantSlug: tenantSlug || undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar la cuenta.";
      setLocalError(msg);
    }
  };

  return (
    <div className="bg-surface-card border-2 border-brand-primary/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
      {/* Encabezado con Regla de Negocio */}
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-2xl bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary font-display block">
            Paso Requerido para Despacho
          </span>
          <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-text-strong font-display">
            Autenticación de Cuenta
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Para confirmar tu pedido y habilitar el rastreo satelital en vivo con mapa en tiempo real, inicia sesión o crea tu cuenta. Tus artículos seleccionados se conservan.
          </p>
        </div>
      </div>

      {/* Selector de Pestañas: Iniciar Sesión vs Crear Cuenta */}
      <div className="flex rounded-full bg-surface-canvas p-1 border border-surface-border">
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setLocalError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
            tab === "login"
              ? "bg-brand-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Ya tengo cuenta</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab("register");
            setLocalError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
            tab === "register"
              ? "bg-brand-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Crear Cuenta Rápida</span>
        </button>
      </div>

      {localError && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-status-danger-bg border border-status-danger-border text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{localError}</span>
        </div>
      )}

      {/* Formulario de Login */}
      {tab === "login" ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-strong">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full text-xs px-4 py-3 rounded-full border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-strong">
              Contraseña
            </label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-4 py-3 rounded-full border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <button
            type="button"
            onClick={handleLoginSubmit}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-surface-border text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95 cursor-pointer font-display min-h-[44px]"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando Credenciales...</span>
              </>
            ) : (
              <span>Iniciar Sesión y Continuar Pedido</span>
            )}
          </button>
        </div>
      ) : (
        /* Formulario de Registro Rápido */
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-strong">
                Nombre Completo
              </label>
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full text-xs px-4 py-3 rounded-full border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-strong">
                Teléfono Celular
              </label>
              <input
                type="tel"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                placeholder="0991234567"
                className="w-full text-xs px-4 py-3 rounded-full border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-strong">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full text-xs px-4 py-3 rounded-full border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-strong">
              Contraseña Segura
            </label>
            <input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="Al menos 6 caracteres"
              className="w-full text-xs px-4 py-3 rounded-full border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <button
            type="button"
            onClick={handleRegisterSubmit}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-surface-border text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95 cursor-pointer font-display min-h-[44px]"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando Cuenta...</span>
              </>
            ) : (
              <span>Crear Cuenta y Finalizar Pedido</span>
            )}
          </button>
        </div>
      )}

      {/* Separador y Google Auth */}
      <div className="relative pt-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
          <span className="bg-surface-card px-3 text-text-muted">O accede al instante con</span>
        </div>
      </div>

      <div className="pt-1 flex justify-center">
        <GoogleSignInButton />
      </div>
    </div>
  );
}
