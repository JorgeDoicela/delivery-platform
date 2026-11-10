import { create } from "zustand";
import { accountApi } from "../api/accountApi";
import type {
  AccountProfile,
  AccountAddress,
  AccountOrderSummary,
  UpdateProfilePayload,
  UpsertAddressPayload,
  ChangePasswordPayload,
  UpdateConsentPayload,
} from "../types";

export type AccountTab =
  | "perfil"
  | "pedidos"
  | "direcciones"
  | "seguridad"
  | "privacidad";

interface AccountState {
  profile: AccountProfile | null;
  orders: AccountOrderSummary[];
  totalOrdersCount: number;
  addresses: AccountAddress[];
  activeTab: AccountTab;

  isLoadingProfile: boolean;
  isLoadingOrders: boolean;
  isLoadingAddresses: boolean;
  isSaving: boolean;

  profileError: string | null;
  ordersError: string | null;
  addressesError: string | null;
  actionSuccessMessage: string | null;

  setActiveTab: (tab: AccountTab) => void;
  clearMessages: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<boolean>;
  fetchOrders: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  saveAddress: (payload: UpsertAddressPayload) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  changePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
  updateConsent: (payload: UpdateConsentPayload) => Promise<boolean>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
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

  setActiveTab: (tab) => set({ activeTab: tab, profileError: null, ordersError: null, addressesError: null, actionSuccessMessage: null }),

  clearMessages: () =>
    set({
      profileError: null,
      ordersError: null,
      addressesError: null,
      actionSuccessMessage: null,
    }),

  fetchProfile: async () => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const profile = await accountApi.getProfile();
      set({ profile, isLoadingProfile: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar el perfil.";
      set({ profileError: msg, isLoadingProfile: false });
    }
  },

  updateProfile: async (payload) => {
    set({ isSaving: true, profileError: null, actionSuccessMessage: null });
    try {
      const updated = await accountApi.updateProfile(payload);
      set({
        profile: updated,
        isSaving: false,
        actionSuccessMessage: "Perfil actualizado exitosamente.",
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar los datos.";
      set({ profileError: msg, isSaving: false });
      return false;
    }
  },

  fetchOrders: async () => {
    set({ isLoadingOrders: true, ordersError: null });
    try {
      const res = await accountApi.getMyOrders();
      set({
        orders: res.orders,
        totalOrdersCount: res.totalCount,
        isLoadingOrders: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al obtener historial de órdenes.";
      set({ ordersError: msg, isLoadingOrders: false });
    }
  },

  fetchAddresses: async () => {
    set({ isLoadingAddresses: true, addressesError: null });
    try {
      const addresses = await accountApi.getAddresses();
      set({ addresses, isLoadingAddresses: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar direcciones guardadas.";
      set({ addressesError: msg, isLoadingAddresses: false });
    }
  },

  saveAddress: async (payload) => {
    set({ isSaving: true, addressesError: null, actionSuccessMessage: null });
    try {
      await accountApi.upsertAddress(payload);
      await get().fetchAddresses();
      set({
        isSaving: false,
        actionSuccessMessage: payload.id
          ? "Dirección actualizada correctamente."
          : "Nueva dirección guardada con éxito.",
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar la dirección.";
      set({ addressesError: msg, isSaving: false });
      return false;
    }
  },

  deleteAddress: async (id) => {
    set({ isSaving: true, addressesError: null, actionSuccessMessage: null });
    try {
      await accountApi.deleteAddress(id);
      await get().fetchAddresses();
      set({
        isSaving: false,
        actionSuccessMessage: "Dirección eliminada correctamente.",
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar la dirección.";
      set({ addressesError: msg, isSaving: false });
      return false;
    }
  },

  changePassword: async (payload) => {
    set({ isSaving: true, profileError: null, actionSuccessMessage: null });
    try {
      await accountApi.changePassword(payload);
      set({
        isSaving: false,
        actionSuccessMessage: "Contraseña actualizada exitosamente.",
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cambiar la contraseña.";
      set({ profileError: msg, isSaving: false });
      return false;
    }
  },

  updateConsent: async (payload) => {
    set({ isSaving: true, profileError: null, actionSuccessMessage: null });
    try {
      await accountApi.updateConsent(payload);
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, hasWhatsAppConsent: payload.whatsAppConsent }
          : null,
        isSaving: false,
        actionSuccessMessage: payload.whatsAppConsent
          ? "Canal de notificaciones por WhatsApp activado conforme a LOPDP."
          : "Consentimiento revocado. No recibirás mensajes automatizados.",
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar preferencias de privacidad.";
      set({ profileError: msg, isSaving: false });
      return false;
    }
  },
}));
