import { create } from "zustand";
import { accountApi } from "../api/accountApi";
import { useAuthStore } from "@/features/auth";
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
  isUploadingAvatar: boolean;

  profileError: string | null;
  ordersError: string | null;
  addressesError: string | null;
  avatarError: string | null;
  actionSuccessMessage: string | null;

  setActiveTab: (tab: AccountTab) => void;
  clearMessages: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<boolean>;
  fetchOrders: (params?: { page?: number; pageSize?: number; status?: string }) => Promise<void>;
  fetchAddresses: () => Promise<void>;
  saveAddress: (payload: UpsertAddressPayload) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  changePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
  updateConsent: (payload: UpdateConsentPayload) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  deleteAvatar: () => Promise<boolean>;
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
  isUploadingAvatar: false,

  profileError: null,
  ordersError: null,
  addressesError: null,
  avatarError: null,
  actionSuccessMessage: null,

  setActiveTab: (tab) => set({ activeTab: tab, profileError: null, ordersError: null, addressesError: null, avatarError: null, actionSuccessMessage: null }),

  clearMessages: () =>
    set({
      profileError: null,
      ordersError: null,
      addressesError: null,
      avatarError: null,
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

  fetchOrders: async (params) => {
    set({ isLoadingOrders: true, ordersError: null });
    try {
      const res = await accountApi.getMyOrders(params);
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

  uploadAvatar: async (file: File) => {
    set({ isUploadingAvatar: true, avatarError: null, actionSuccessMessage: null });
    try {
      const res = await accountApi.uploadAvatar(file);
      set((state) => ({
        profile: state.profile ? { ...state.profile, avatarUrl: res.avatarUrl } : null,
        isUploadingAvatar: false,
        actionSuccessMessage: "Foto de perfil actualizada con éxito.",
      }));

      // Sincronizar en vivo con el usuario autenticado
      const currentAuthUser = useAuthStore.getState().user;
      if (currentAuthUser) {
        useAuthStore.getState().setUser({
          ...currentAuthUser,
          avatarUrl: res.avatarUrl,
        });
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir y procesar la foto de perfil.";
      set({ avatarError: msg, isUploadingAvatar: false });
      return false;
    }
  },

  deleteAvatar: async () => {
    set({ isUploadingAvatar: true, avatarError: null, actionSuccessMessage: null });
    try {
      await accountApi.deleteAvatar();
      set((state) => ({
        profile: state.profile ? { ...state.profile, avatarUrl: null } : null,
        isUploadingAvatar: false,
        actionSuccessMessage: "Foto de perfil eliminada.",
      }));

      const currentAuthUser = useAuthStore.getState().user;
      if (currentAuthUser) {
        useAuthStore.getState().setUser({
          ...currentAuthUser,
          avatarUrl: null,
        });
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar la foto de perfil.";
      set({ avatarError: msg, isUploadingAvatar: false });
      return false;
    }
  },
}));

