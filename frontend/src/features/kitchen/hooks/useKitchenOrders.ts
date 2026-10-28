'use client';

import { useState, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { apiClient } from '@/shared/lib/api-client';
import { KitchenOrderTicketDto, OrderStatus } from '@/shared/types/api';
import { kitchenAlertSound } from '../lib/sound';

export function useKitchenOrders(branchId: number) {
  const [orders, setOrders] = useState<KitchenOrderTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiClient.getActiveKitchenOrders(branchId);
      setOrders(data);
      setError(null);
    } catch {
      setError('Error al sincronizar comandas de cocina con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    let isSubscribed = true;

    const loadOrders = async () => {
      try {
        const data = await apiClient.getActiveKitchenOrders(branchId);
        if (isSubscribed) {
          setOrders(data);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (isSubscribed) {
          setError('Error al sincronizar comandas de cocina con el servidor.');
          setLoading(false);
        }
      }
    };

    loadOrders();

    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
    const hubUrl = baseUrl.endsWith('/hubs') ? `${baseUrl}/kitchen` : `${baseUrl}/hubs/kitchen`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(async () => {
        if (isSubscribed) setConnectionStatus('connected');
        await connection.invoke('JoinBranchKitchen', branchId).catch(() => {});
      })
      .catch(() => {
        if (isSubscribed) setConnectionStatus('disconnected');
      });

    connection.onreconnecting(() => setConnectionStatus('connecting'));
    connection.onreconnected(async () => {
      setConnectionStatus('connected');
      await connection.invoke('JoinBranchKitchen', branchId).catch(() => {});
      fetchOrders();
    });
    connection.onclose(() => setConnectionStatus('disconnected'));

    connection.on('ReceiveNewOrder', (newOrder: KitchenOrderTicketDto) => {
      kitchenAlertSound.playNewOrderChime();
      setOrders((prev) => {
        const exists = prev.some((o) => o.orderId === newOrder.orderId);
        if (exists) return prev;
        return [...prev, newOrder];
      });
    });

    connection.on(
      'OrderStatusChanged',
      (orderIdOrData: string | { orderId: string; status: OrderStatus }, maybeStatus?: string | OrderStatus) => {
        let targetOrderId: string;
        let newStatus: OrderStatus;

        if (typeof orderIdOrData === 'string') {
          targetOrderId = orderIdOrData;
          if (typeof maybeStatus === 'string') {
            newStatus = OrderStatus[maybeStatus as keyof typeof OrderStatus] ?? OrderStatus.Confirmed;
          } else {
            newStatus = maybeStatus ?? OrderStatus.Confirmed;
          }
        } else {
          targetOrderId = orderIdOrData.orderId;
          newStatus = orderIdOrData.status;
        }

        setOrders((prev) => {
          const activeStatuses = [
            OrderStatus.Confirmed,
            OrderStatus.InKitchen,
            OrderStatus.ReadyForDelivery,
          ];

          if (!activeStatuses.includes(newStatus)) {
            // Si pasa a OnTheWay, Delivered o Cancelled se retira de la pantalla de cocina
            return prev.filter((o) => o.orderId !== targetOrderId);
          }

          return prev.map((o) =>
            o.orderId === targetOrderId ? { ...o, status: newStatus } : o
          );
        });
      }
    );

    // Polling de respaldo cada 20s
    const pollInterval = setInterval(fetchOrders, 20000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      connection.invoke('LeaveBranchKitchen', branchId).catch(() => {});
      connection.stop().catch(() => {});
    };
  }, [branchId, fetchOrders]);

  const advanceOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await apiClient.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => {
        const activeStatuses = [
          OrderStatus.Confirmed,
          OrderStatus.InKitchen,
          OrderStatus.ReadyForDelivery,
        ];
        if (!activeStatuses.includes(nextStatus)) {
          return prev.filter((o) => o.orderId !== orderId);
        }
        return prev.map((o) =>
          o.orderId === orderId ? { ...o, status: nextStatus } : o
        );
      });
    } catch {
      // Re-sincronizar ante error
      fetchOrders();
    }
  };

  return {
    orders,
    loading,
    error,
    connectionStatus,
    refresh: fetchOrders,
    advanceOrderStatus,
  };
}
