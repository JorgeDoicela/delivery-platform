import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "../api/authApi";
import { isJwtExpired } from "@/shared/lib/jwt";
import {
  setApiClientAccessToken,
  setApiClientTenantSlug,
} from "@/shared/lib/api-client";
import type {
  AuthState,
  AuthUser,
  AuthStatus,
  RegisterRequest,
  GoogleAuthRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
} from "../types";
import type { LoginFormData } from "../schemas/loginSchema";

const SESSION_STORAGE_KEY = "delivery_has_session";

function normalizeAuthUser(user: AuthUser, forceSyncTenant = false): AuthUser {
  const primaryRole = user.role || user.roles?.[0] || "Customer";
  const isSuperAdmin =
    primaryRole === "SuperAdmin" ||
    Number(primaryRole) === 1 ||
    user.roles?.includes("SuperAdmin");

  if (user.tenantSlug) {
    const isOperationalPath =
      typeof window !== "undefined" &&
      /^\/([a-z0-9_-]+\/)?(cocina|kitchen|admin|repartidor|active-delivery)(\/|$)/i.test(
        window.location.pathname
      );

    if (forceSyncTenant || (isOperationalPath && !isSuperAdmin)) {
      setApiClientTenantSlug(user.tenantSlug);
    }
  }
  return {
    ...user,
    role: primaryRole,
    isActive: user.isActive ?? true,
  };
}

interface AuthActions {
  login: (credentials: LoginFormData) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  loginWithGoogle: (data: GoogleAuthRequest) => Promise<boolean>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<{ success: boolean; message: string }>;
  resetPassword: (data: ResetPasswordRequest) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<VerifyEmailResponse>;
  resendVerification: (data: ResendVerificationRequest) => Promise<ResendVerificationResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setHydrated: (isHydrated: boolean) => void;
  resetStatus: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      status: "idle" as AuthStatus,
      error: null,
      isAuthenticated: false,
      isHydrated: false,

      setHydrated: (isHydrated) => {
        set({ isHydrated });
      },

      setAccessToken: (accessToken) => {
        setApiClientAccessToken(accessToken);
        set({
          accessToken,
          isAuthenticated: accessToken !== null,
        });
      },

      setUser: (user) => {
        set({ user: user ? normalizeAuthUser(user) : null });
      },

      resetStatus: () => {
        set({ status: "idle", error: null });
      },

      login: async (credentials) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.login(credentials);
          const normalizedUser = normalizeAuthUser(response.user, true);
          setApiClientAccessToken(response.accessToken);

          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_STORAGE_KEY, "1");
          }

          set({
            user: normalizedUser,
            accessToken: response.accessToken,
            isAuthenticated: true,
            status: "success",
            error: null,
          });
          return true;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al iniciar sesión.";

          setApiClientAccessToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            status: "error",
            error: message,
          });
          return false;
        }
      },

      register: async (data) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.register(data);
          const normalizedUser = normalizeAuthUser(response.user, true);
          setApiClientAccessToken(response.accessToken);

          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_STORAGE_KEY, "1");
          }

          set({
            user: normalizedUser,
            accessToken: response.accessToken,
            isAuthenticated: true,
            status: "success",
            error: null,
          });
          return true;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al registrar la cuenta.";

          setApiClientAccessToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            status: "error",
            error: message,
          });
          return false;
        }
      },

      loginWithGoogle: async (data) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.loginWithGoogle(data);
          const normalizedUser = normalizeAuthUser(response.user, true);
          setApiClientAccessToken(response.accessToken);

          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_STORAGE_KEY, "1");
          }

          set({
            user: normalizedUser,
            accessToken: response.accessToken,
            isAuthenticated: true,
            status: "success",
            error: null,
          });
          return true;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al iniciar sesión con Google.";

          setApiClientAccessToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            status: "error",
            error: message,
          });
          return false;
        }
      },

      forgotPassword: async (data) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.forgotPassword(data);
          set({ status: "success", error: null });
          return { success: true, message: response.message };
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al solicitar restablecimiento de contraseña.";
          set({ status: "error", error: message });
          return { success: false, message };
        }
      },

      resetPassword: async (data) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.resetPassword(data);
          set({ status: "success", error: null });
          return { success: response.success, message: response.message };
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al restablecer la contraseña.";
          set({ status: "error", error: message });
          return { success: false, message };
        }
      },

      verifyEmail: async (data) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.verifyEmail(data);
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                isEmailVerified: true,
                emailVerifiedAt: new Date().toISOString(),
              },
            });
          }
          set({ status: "success", error: null });
          return response;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al verificar el correo electrónico.";
          set({ status: "error", error: message });
          throw err;
        }
      },

      resendVerification: async (data) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.resendVerification(data);
          set({ status: "success", error: null });
          return response;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al reenviar el correo de verificación.";
          set({ status: "error", error: message });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Si el logout remoto falla por red, se limpia de todas formas el estado local
        } finally {
          setApiClientAccessToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            status: "idle",
            error: null,
          });
        }
      },

      checkAuth: async () => {
        // 0. Si el store no se ha hidratado aún en el cliente, esperar rehidratación
        if (typeof window !== "undefined" && !get().isHydrated) {
          try {
            await useAuthStore.persist.rehydrate();
          } catch {
            // Continuar con el estado actual
          }
        }

        // 1. Si ya tiene accessToken en memoria y usuario activo, y NO está expirado, la sesión es válida
        const currentToken = get().accessToken;
        if (currentToken && get().user && !isJwtExpired(currentToken)) {
          setApiClientAccessToken(currentToken);
          return true;
        }

        // 2. Si no existe indicador de sesión previa en el navegador, no llamar a /refresh
        // para evitar errores 401 innecesarios en la consola de usuarios no autenticados
        if (typeof window !== "undefined") {
          const hasSession = localStorage.getItem(SESSION_STORAGE_KEY);
          if (!hasSession && !get().isAuthenticated && !get().user) {
            setApiClientAccessToken(null);
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              status: "idle",
              error: null,
            });
            return false;
          }
        }

        set({ status: "loading" });
        try {
          const refreshResponse = await authApi.refresh();
          const fallbackUser = get().user;
          const resolvedUser = refreshResponse.user
            ? normalizeAuthUser(refreshResponse.user)
            : fallbackUser;

          setApiClientAccessToken(refreshResponse.accessToken);
          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_STORAGE_KEY, "1");
          }

          set({
            user: resolvedUser,
            accessToken: refreshResponse.accessToken,
            isAuthenticated: true,
            status: "idle",
            error: null,
          });
          return true;
        } catch {
          setApiClientAccessToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            status: "idle",
            error: null,
          });
          return false;
        }
      },
    }),
    {
      name: "delivery_auth_session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          if (state.accessToken) {
            setApiClientAccessToken(state.accessToken);
          }
        }
      },
    }
  )
);

if (typeof window !== "undefined") {
  useAuthStore.persist?.onFinishHydration?.(() => {
    useAuthStore.setState({ isHydrated: true });
    const currentToken = useAuthStore.getState().accessToken;
    if (currentToken) {
      setApiClientAccessToken(currentToken);
    }
  });
}

