import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./useAuthStore";
import { authApi } from "../api/authApi";
import { UserRole } from "../types";

vi.mock("../api/authApi", () => ({
  authApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      status: "idle",
      error: null,
      isAuthenticated: false,
    });
  });

  it("debe inicializar con estado desautenticado", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
  });

  it("debe iniciar sesión exitosamente", async () => {
    const mockUser = {
      id: "b9a71dc1-1a32-4754-a957-3b2d13aa11e1",
      email: "cocina@asaderolagranjita.com",
      fullName: "Jefe de Cocina",
      role: UserRole.KitchenStaff,
      tenantId: "00000000-0000-0000-0000-000000000001",
      branchId: "550e8400-e29b-41d4-a716-446655440000",
      isActive: true,
    };

    vi.mocked(authApi.login).mockResolvedValueOnce({
      accessToken: "mock.jwt.token",
      user: mockUser,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    const success = await useAuthStore.getState().login({
      email: "cocina@asaderolagranjita.com",
      password: "Password123!",
    });

    expect(success).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("mock.jwt.token");
    expect(state.user?.email).toBe("cocina@asaderolagranjita.com");
    expect(state.status).toBe("success");
    expect(state.error).toBeNull();
  });

  it("debe manejar error de inicio de sesión", async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(
      new Error("Credenciales inválidas.")
    );

    const success = await useAuthStore.getState().login({
      email: "invalido@dominio.com",
      password: "wrongpassword",
    });

    expect(success).toBe(false);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe("error");
    expect(state.error).toBe("Credenciales inválidas.");
  });

  it("debe cerrar sesión y limpiar el estado", async () => {
    useAuthStore.setState({
      accessToken: "token.previo",
      isAuthenticated: true,
      user: {
        id: "1",
        email: "test@test.com",
        fullName: "Test",
        role: UserRole.Cashier,
        tenantId: "1",
        branchId: null,
        isActive: true,
      },
    });

    vi.mocked(authApi.logout).mockResolvedValueOnce();

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe("idle");
    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });

  it("debe restaurar la sesión con checkAuth si existe cookie de refresh", async () => {
    const mockUser = {
      id: "2",
      email: "admin@asaderolagranjita.com",
      fullName: "Admin",
      role: UserRole.TenantAdmin,
      tenantId: "1",
      branchId: null,
      isActive: true,
    };

    vi.mocked(authApi.refresh).mockResolvedValueOnce({
      accessToken: "nuevo.jwt.token",
      user: mockUser,
      expiresAt: new Date().toISOString(),
    });

    const isAuthed = await useAuthStore.getState().checkAuth();

    expect(isAuthed).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("nuevo.jwt.token");
    expect(state.user?.role).toBe(UserRole.TenantAdmin);
  });
});

