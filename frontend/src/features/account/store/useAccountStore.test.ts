import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAccountStore } from "./useAccountStore";
import { accountApi } from "../api/accountApi";

vi.mock("../api/accountApi", () => ({
  accountApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getMyOrders: vi.fn(),
    getAddresses: vi.fn(),
    upsertAddress: vi.fn(),
    deleteAddress: vi.fn(),
    changePassword: vi.fn(),
    updateConsent: vi.fn(),
  },
}));

describe("useAccountStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAccountStore.setState({
      profile: null,
      orders: [],
      totalOrdersCount: 0,
      addresses: [],
      activeTab: "perfil",
      isLoadingProfile: false,
      isLoadingOrders: false,
      isLoadingAddresses: false,
      isSaving: false,
      profileError: null,
      ordersError: null,
      addressesError: null,
      actionSuccessMessage: null,
    });
  });

  it("debe cargar el perfil correctamente", async () => {
    const mockProfile = {
      id: "u1",
      email: "carlos@example.com",
      fullName: "Carlos Mendoza",
      phone: "+593987654321",
      role: "Customer",
      isEmailVerified: true,
      tenantId: null,
      tenantSlug: null,
      tenantName: null,
      identificationType: "CEDULA" as const,
      identificationNumber: "1712345678",
      hasWhatsAppConsent: true,
      activeOrdersCount: 1,
      totalOrdersCount: 5,
    };

    vi.mocked(accountApi.getProfile).mockResolvedValue(mockProfile);

    await useAccountStore.getState().fetchProfile();

    const state = useAccountStore.getState();
    expect(state.profile).toEqual(mockProfile);
    expect(state.isLoadingProfile).toBe(false);
    expect(state.profileError).toBeNull();
  });

  it("debe cambiar de tab limpiando errores previos", () => {
    useAccountStore.setState({ profileError: "Error previo" });
    useAccountStore.getState().setActiveTab("pedidos");

    const state = useAccountStore.getState();
    expect(state.activeTab).toBe("pedidos");
    expect(state.profileError).toBeNull();
  });

  it("debe actualizar perfil y registrar mensaje de éxito", async () => {
    const updatedProfile = {
      id: "u1",
      email: "carlos@example.com",
      fullName: "Carlos Mendoza Modificado",
      phone: "+593999999999",
      role: "Customer",
      isEmailVerified: true,
      tenantId: null,
      tenantSlug: null,
      tenantName: null,
      identificationType: "CEDULA" as const,
      identificationNumber: "1712345678",
      hasWhatsAppConsent: true,
      activeOrdersCount: 0,
      totalOrdersCount: 5,
    };

    vi.mocked(accountApi.updateProfile).mockResolvedValue(updatedProfile);

    const success = await useAccountStore.getState().updateProfile({
      fullName: "Carlos Mendoza Modificado",
      phone: "+593999999999",
    });

    expect(success).toBe(true);
    const state = useAccountStore.getState();
    expect(state.profile?.fullName).toBe("Carlos Mendoza Modificado");
    expect(state.actionSuccessMessage).toBe("Perfil actualizado exitosamente.");
  });

  it("debe alternar el consentimiento de WhatsApp y actualizar estado", async () => {
    useAccountStore.setState({
      profile: {
        id: "u1",
        email: "carlos@example.com",
        fullName: "Carlos",
        phone: "+593987654321",
        role: "Customer",
        isEmailVerified: true,
        tenantId: null,
        tenantSlug: null,
        tenantName: null,
        identificationType: null,
        identificationNumber: null,
        hasWhatsAppConsent: false,
        activeOrdersCount: 0,
        totalOrdersCount: 0,
      },
    });

    vi.mocked(accountApi.updateConsent).mockResolvedValue(true);

    const success = await useAccountStore.getState().updateConsent({
      whatsAppConsent: true,
    });

    expect(success).toBe(true);
    expect(useAccountStore.getState().profile?.hasWhatsAppConsent).toBe(true);
  });
});
