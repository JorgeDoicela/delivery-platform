import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDriverStore } from './useDriverStore';
import { apiClient } from '@/shared/lib/api-client';
import { OrderStatus, PaymentMethod } from '@/shared/types/api';

describe('useDriverStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useDriverStore.setState({
      profile: null,
      activeOrders: [],
      availableOrders: [],
      deliveredToday: [],
      shiftSummary: { completedCount: 0, cashCollected: 0, totalEarnings: 0 },
      selectedOrderId: null,
      activeTab: 'active',
      loading: false,
      error: null,
    });
  });

  it('fetchDashboard loads profile and classifies active and available orders', async () => {
    const mockProfile = {
      driverId: 'd-1',
      userId: 'u-1',
      fullName: 'Pedro Motorizado',
      email: 'pedro@mesafy.com',
      phone: '099000111',
      vehicleType: 'Motocicleta',
      isAvailable: true,
      todayDeliveredCount: 2,
      todayCashCollected: 50,
    };

    const mockOrders = {
      activeOrders: [
        {
          orderId: 'ord-active-1',
          orderNumber: 101,
          customerName: 'Cliente Activo',
          customerPhone: '099111222',
          addressStreet: 'Av. Amazonas y Colón',
          addressReference: 'Edificio Centro',
          subtotal: 20,
          deliveryFee: 2.5,
          total: 22.5,
          paymentMethod: PaymentMethod.Cash,
          status: OrderStatus.OnTheWay,
          createdAt: '2026-11-06T14:00:00Z',
          branchName: 'Norte',
          items: [{ productName: '1/2 Pollo', quantity: 1, modifiers: [] }],
        },
      ],
      availableOrders: [
        {
          orderId: 'ord-avail-1',
          orderNumber: 102,
          customerName: 'Cliente Cocina',
          customerPhone: '099333444',
          addressStreet: 'Shyris y Portugal',
          addressReference: '',
          subtotal: 30,
          deliveryFee: 3.0,
          total: 33.0,
          paymentMethod: PaymentMethod.BankTransfer,
          status: OrderStatus.ReadyForDelivery,
          createdAt: '2026-11-06T14:10:00Z',
          branchName: 'Norte',
          items: [],
        },
      ],
      deliveredToday: [],
      shiftSummary: { completedCount: 2, cashCollected: 50, totalEarnings: 5.0 },
    };

    vi.spyOn(apiClient, 'getDriverProfile').mockResolvedValue(mockProfile);
    vi.spyOn(apiClient, 'getDriverOrders').mockResolvedValue(mockOrders);

    await useDriverStore.getState().fetchDashboard();

    const state = useDriverStore.getState();
    expect(state.profile?.fullName).toBe('Pedro Motorizado');
    expect(state.activeOrders).toHaveLength(1);
    expect(state.availableOrders).toHaveLength(1);
    expect(state.selectedOrderId).toBe('ord-active-1');
    expect(state.loading).toBe(false);
  });

  it('claimOrder moves order from available to active and selects it', async () => {
    const availableOrder = {
      orderId: 'ord-avail-1',
      orderNumber: 102,
      customerName: 'Cliente Cocina',
      customerPhone: '099333444',
      addressStreet: 'Shyris y Portugal',
      addressReference: '',
      subtotal: 30,
      deliveryFee: 3.0,
      total: 33.0,
      paymentMethod: PaymentMethod.BankTransfer,
      status: OrderStatus.ReadyForDelivery,
      createdAt: '2026-11-06T14:10:00Z',
      branchName: 'Norte',
      items: [],
    };

    const claimedOrder = {
      ...availableOrder,
      status: OrderStatus.OnTheWay,
      assignedAt: '2026-11-06T14:15:00Z',
    };

    useDriverStore.setState({
      availableOrders: [availableOrder],
      activeOrders: [],
      activeTab: 'available',
    });

    vi.spyOn(apiClient, 'claimDriverOrder').mockResolvedValue(claimedOrder);

    const success = await useDriverStore.getState().claimOrder('ord-avail-1');
    expect(success).toBe(true);

    const state = useDriverStore.getState();
    expect(state.availableOrders).toHaveLength(0);
    expect(state.activeOrders).toHaveLength(1);
    expect(state.selectedOrderId).toBe('ord-avail-1');
    expect(state.activeTab).toBe('active');
  });

  it('completeDelivery updates order to delivered and adds cash to shift summary', async () => {
    const activeOrder = {
      orderId: 'ord-cash-1',
      orderNumber: 105,
      customerName: 'Cliente Efectivo',
      customerPhone: '099555666',
      addressStreet: 'Av. República',
      addressReference: '',
      subtotal: 40,
      deliveryFee: 3.5,
      total: 43.5,
      paymentMethod: PaymentMethod.Cash,
      status: OrderStatus.OnTheWay,
      createdAt: '2026-11-06T14:00:00Z',
      branchName: 'Norte',
      items: [],
    };

    useDriverStore.setState({
      profile: {
        driverId: 'd-1',
        userId: 'u-1',
        fullName: 'Pedro Motorizado',
        email: 'pedro@mesafy.com',
        phone: '099000111',
        vehicleType: 'Moto',
        isAvailable: true,
        todayDeliveredCount: 0,
        todayCashCollected: 0,
      },
      activeOrders: [activeOrder],
      deliveredToday: [],
      shiftSummary: { completedCount: 0, cashCollected: 0, totalEarnings: 0 },
      selectedOrderId: 'ord-cash-1',
    });

    vi.spyOn(apiClient, 'updateOrderStatus').mockResolvedValue(undefined);

    const success = await useDriverStore.getState().completeDelivery('ord-cash-1');
    expect(success).toBe(true);

    const state = useDriverStore.getState();
    expect(state.activeOrders).toHaveLength(0);
    expect(state.deliveredToday).toHaveLength(1);
    expect(state.shiftSummary.completedCount).toBe(1);
    expect(state.shiftSummary.cashCollected).toBe(43.5);
    expect(state.shiftSummary.totalEarnings).toBe(3.5);
    expect(state.profile?.todayCashCollected).toBe(43.5);
    expect(state.profile?.todayDeliveredCount).toBe(1);
  });

  it('toggleAvailability updates availability status in profile', async () => {
    useDriverStore.setState({
      profile: {
        driverId: 'd-1',
        userId: 'u-1',
        fullName: 'Pedro Motorizado',
        email: 'pedro@mesafy.com',
        phone: '099000111',
        vehicleType: 'Moto',
        isAvailable: true,
        todayDeliveredCount: 0,
        todayCashCollected: 0,
      },
    });

    vi.spyOn(apiClient, 'updateDriverStatus').mockResolvedValue({
      driverId: 'd-1',
      isAvailable: false,
      vehicleType: 'Moto',
      updatedAt: '2026-11-06T14:30:00Z',
    });

    const success = await useDriverStore.getState().toggleAvailability(false);
    expect(success).toBe(true);
    expect(useDriverStore.getState().profile?.isAvailable).toBe(false);
  });
});

