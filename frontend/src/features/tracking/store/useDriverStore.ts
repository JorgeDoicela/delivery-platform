import { create } from 'zustand';
import { apiClient } from '@/shared/lib/api-client';
import {
  DriverProfileResponse,
  DriverOrderDto,
  DriverShiftSummaryDto,
  OrderStatus,
} from '@/shared/types/api';

export type DriverTab = 'active' | 'available' | 'shift';

interface DriverStoreState {
  profile: DriverProfileResponse | null;
  activeOrders: DriverOrderDto[];
  availableOrders: DriverOrderDto[];
  deliveredToday: DriverOrderDto[];
  shiftSummary: DriverShiftSummaryDto;
  selectedOrderId: string | null;
  activeTab: DriverTab;
  loading: boolean;
  error: string | null;

  // Acciones
  fetchDashboard: () => Promise<void>;
  toggleAvailability: (isAvailable: boolean) => Promise<boolean>;
  claimOrder: (orderId: string) => Promise<boolean>;
  completeDelivery: (orderId: string) => Promise<boolean>;
  setSelectedOrderId: (orderId: string | null) => void;
  setActiveTab: (tab: DriverTab) => void;
  handleOrderStatusChange: (orderId: string, status: OrderStatus) => void;
}

const initialShiftSummary: DriverShiftSummaryDto = {
  completedCount: 0,
  cashCollected: 0,
  totalEarnings: 0,
};

export const useDriverStore = create<DriverStoreState>()((set, get) => ({
  profile: null,
  activeOrders: [],
  availableOrders: [],
  deliveredToday: [],
  shiftSummary: initialShiftSummary,
  selectedOrderId: null,
  activeTab: 'active',
  loading: true,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const [profileData, ordersData] = await Promise.all([
        apiClient.getDriverProfile(),
        apiClient.getDriverOrders(),
      ]);

      const active = ordersData.activeOrders || [];
      const currentSelected = get().selectedOrderId;
      const nextSelected =
        active.length > 0
          ? active.some((o) => o.orderId === currentSelected)
            ? currentSelected
            : active[0].orderId
          : null;

      set({
        profile: profileData,
        activeOrders: active,
        availableOrders: ordersData.availableOrders || [],
        deliveredToday: ordersData.deliveredToday || [],
        shiftSummary: ordersData.shiftSummary || initialShiftSummary,
        selectedOrderId: nextSelected,
        loading: false,
        error: null,
      });
    } catch {
      set({
        loading: false,
        error: 'No se pudo sincronizar el estado del repartidor con el servidor.',
      });
    }
  },

  toggleAvailability: async (isAvailable: boolean) => {
    try {
      const response = await apiClient.updateDriverStatus({ isAvailable });
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, isAvailable: response.isAvailable }
          : null,
      }));
      return true;
    } catch {
      return false;
    }
  },

  claimOrder: async (orderId: string) => {
    try {
      const claimedOrder = await apiClient.claimDriverOrder(orderId);
      set((state) => {
        const nextAvailable = state.availableOrders.filter((o) => o.orderId !== orderId);
        const nextActive = [claimedOrder, ...state.activeOrders.filter((o) => o.orderId !== orderId)];
        return {
          availableOrders: nextAvailable,
          activeOrders: nextActive,
          selectedOrderId: claimedOrder.orderId,
          activeTab: 'active',
        };
      });
      return true;
    } catch {
      return false;
    }
  },

  completeDelivery: async (orderId: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, OrderStatus.Delivered);

      // Mover orden a entregados y actualizar resumen de turno
      set((state) => {
        const targetOrder = state.activeOrders.find((o) => o.orderId === orderId);
        const nextActive = state.activeOrders.filter((o) => o.orderId !== orderId);
        const nextSelected = nextActive.length > 0 ? nextActive[0].orderId : null;

        if (!targetOrder) {
          return {
            activeOrders: nextActive,
            selectedOrderId: nextSelected,
          };
        }

        const deliveredOrder: DriverOrderDto = {
          ...targetOrder,
          status: OrderStatus.Delivered,
          deliveredAt: new Date().toISOString(),
        };

        const isCash = Number(deliveredOrder.paymentMethod) === 1; // CashOnDelivery = 1
        const cashToAdd = isCash ? deliveredOrder.total : 0;

        const nextDelivered = [deliveredOrder, ...state.deliveredToday];
        const nextShiftSummary: DriverShiftSummaryDto = {
          completedCount: state.shiftSummary.completedCount + 1,
          cashCollected: state.shiftSummary.cashCollected + cashToAdd,
          totalEarnings: state.shiftSummary.totalEarnings + deliveredOrder.deliveryFee,
        };

        const nextProfile = state.profile
          ? {
              ...state.profile,
              todayDeliveredCount: state.profile.todayDeliveredCount + 1,
              todayCashCollected: state.profile.todayCashCollected + cashToAdd,
            }
          : null;

        return {
          activeOrders: nextActive,
          deliveredToday: nextDelivered,
          shiftSummary: nextShiftSummary,
          profile: nextProfile,
          selectedOrderId: nextSelected,
        };
      });

      return true;
    } catch {
      return false;
    }
  },

  setSelectedOrderId: (orderId: string | null) => {
    set({ selectedOrderId: orderId });
  },

  setActiveTab: (tab: DriverTab) => {
    set({ activeTab: tab });
  },

  handleOrderStatusChange: (orderId: string, status: OrderStatus) => {
    // Si la orden cambió de estado remotamente (ej: cancelada o entregada por otro operador)
    if (status === OrderStatus.ReadyForDelivery) {
      // Nueva orden disponible: refrescar para tener el DTO completo
      get().fetchDashboard();
    } else if (status === OrderStatus.Delivered || status === OrderStatus.Cancelled) {
      set((state) => {
        const nextActive = state.activeOrders.filter((o) => o.orderId !== orderId);
        const nextAvailable = state.availableOrders.filter((o) => o.orderId !== orderId);
        const nextSelected =
          state.selectedOrderId === orderId
            ? nextActive.length > 0
              ? nextActive[0].orderId
              : null
            : state.selectedOrderId;

        return {
          activeOrders: nextActive,
          availableOrders: nextAvailable,
          selectedOrderId: nextSelected,
        };
      });
    }
  },
}));

