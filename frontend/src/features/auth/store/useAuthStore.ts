import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "../api/authApi";
import type { AuthState, AuthUser, AuthStatus } from "../types";
import type { LoginFormData } from "../schemas/loginSchema";

const SESSION_STORAGE_KEY = "delivery_has_session";

interface AuthActions {
  login: (credentials: LoginFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
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

      setAccessToken: (accessToken) => {
        set({
          accessToken,
          isAuthenticated: accessToken !== null,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      resetStatus: () => {
        set({ status: "idle", error: null });
      },

      login: async (credentials) => {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.login(credentials);

          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_STORAGE_KEY, "1");
          }

          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            status: "success",
            error: null,
          });
          return true;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Error al iniciar sesión.";

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

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Si el logout remoto falla por red, se limpia de todas formas el estado local
        } finally {
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
        // 1. Si ya tiene accessToken en memoria y usuario activo, la sesión es válida
        if (get().accessToken && get().user) {
          return true;
        }

        // 2. Si no existe indicador de sesión previa en el navegador, no llamar a /refresh
        // para evitar errores 401 innecesarios en la consola de usuarios no autenticados
        if (typeof window !== "undefined") {
          const hasSession = localStorage.getItem(SESSION_STORAGE_KEY);
          if (!hasSession && !get().isAuthenticated && !get().user) {
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

          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_STORAGE_KEY, "1");
          }

          set({
            user: refreshResponse.user,
            accessToken: refreshResponse.accessToken,
            isAuthenticated: true,
            status: "idle",
            error: null,
          });
          return true;
        } catch {
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
      }),
    }
  )
);

