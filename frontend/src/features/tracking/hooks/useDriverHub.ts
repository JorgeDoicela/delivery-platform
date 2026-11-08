'use client';

import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useDriverStore } from '../store/useDriverStore';
import { useAuthStore } from '@/features/auth';
import { kitchenAlertSound } from '@/features/kitchen/lib/sound';
import { OrderStatus } from '@/shared/types/api';

export type DriverConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface UseDriverHubOptions {
  branchId?: number | null;
  enabled?: boolean;
}

export function useDriverHub({ branchId, enabled = true }: UseDriverHubOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<DriverConnectionStatus>('disconnected');
  const handleOrderStatusChange = useDriverStore((s) => s.handleOrderStatusChange);
  const fetchDashboard = useDriverStore((s) => s.fetchDashboard);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    const baseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5005');
    const hubUrl = baseUrl.endsWith('/hubs') ? `${baseUrl}/kitchen` : `${baseUrl}/hubs/kitchen`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => useAuthStore.getState().accessToken || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => {
      if (isMounted) setConnectionStatus('reconnecting');
    });

    connection.onreconnected(async () => {
      if (!isMounted) return;
      setConnectionStatus('connected');
      if (branchId) {
        await connection.invoke('JoinBranchKitchen', branchId).catch(() => {});
      }
      void fetchDashboard();
    });

    connection.onclose(() => {
      if (isMounted) setConnectionStatus('disconnected');
    });

    connection.on(
      'OrderStatusChanged',
      (orderIdOrData: string | { orderId: string; status: OrderStatus }, maybeStatus?: string | OrderStatus) => {
        let orderId = '';
        let status: OrderStatus = OrderStatus.Created;

        if (typeof orderIdOrData === 'object' && orderIdOrData !== null) {
          orderId = orderIdOrData.orderId;
          status = orderIdOrData.status;
        } else if (typeof orderIdOrData === 'string') {
          orderId = orderIdOrData;
          if (maybeStatus !== undefined) {
            status = typeof maybeStatus === 'string' ? (Number(maybeStatus) as OrderStatus) : maybeStatus;
          }
        }

        if (orderId) {
          if (status === OrderStatus.ReadyForDelivery) {
            kitchenAlertSound.playNewOrderChime();
          }
          handleOrderStatusChange(orderId, status);
          void fetchDashboard();
        }
      }
    );

    connection.on('ReceiveNewOrder', () => {
      void fetchDashboard();
    });

    connection
      .start()
      .then(async () => {
        if (!isMounted) {
          await connection.stop().catch(() => {});
          return;
        }
        setConnectionStatus('connected');
        if (branchId) {
          await connection.invoke('JoinBranchKitchen', branchId).catch(() => {});
        }
      })
      .catch(() => {
        if (isMounted) setConnectionStatus('disconnected');
      });

    // Polling resiliente en segundo plano (cada 25s sólo si la pestaña está activa)
    const fallbackInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchDashboard();
      }
    }, 25000);

    // Revalidación instantánea cuando el repartidor vuelve a enfocar la app
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchDashboard();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      clearInterval(fallbackInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
      }
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
    };
  }, [branchId, enabled, handleOrderStatusChange, fetchDashboard]);

  return { connectionStatus };
}


