import { create } from "zustand";
import { authApi } from "../api/authApi";
import type { AuthState, AuthUser, AuthStatus } from "../types";
import type { LoginFormData } from "../schemas/loginSchema";

interface AuthActions {
  login: (credentials: LoginFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  resetStatus: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
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
    // Si ya tiene un accessToken activo y usuario cargado, retorna inmediatamente
    if (get().accessToken && get().user) {
      return true;
    }

    set({ status: "loading" });
    try {
      const refreshResponse = await authApi.refresh();
      set({
        user: refreshResponse.user,
        accessToken: refreshResponse.accessToken,
        isAuthenticated: true,
        status: "idle",
        error: null,
      });
      return true;
    } catch {
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
}));

