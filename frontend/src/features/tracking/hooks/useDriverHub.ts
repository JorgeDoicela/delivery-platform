'use client';

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useDriverStore } from '../store/useDriverStore';
import { kitchenAlertSound } from '@/features/kitchen/lib/sound';
import { OrderStatus } from '@/shared/types/api';

interface UseDriverHubOptions {
  branchId?: number | null;
  enabled?: boolean;
}

export function useDriverHub({ branchId, enabled = true }: UseDriverHubOptions = {}) {
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
      .withUrl(hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connectionRef.current = connection;

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
        }
      }
    );

    connection.on('ReceiveNewOrder', () => {
      // Nueva orden en preparación: refrescar para visibilidad de demanda
      fetchDashboard();
    });

    connection
      .start()
      .then(async () => {
        if (!isMounted) {
          await connection.stop().catch(() => {});
          return;
        }
        if (branchId) {
          await connection.invoke('JoinBranchKitchen', branchId).catch(() => {});
        }
      })
      .catch(() => {
        // En caso de fallo inicial, automatic reconnect reintentará
      });

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
    };
  }, [branchId, enabled, handleOrderStatusChange, fetchDashboard]);
}

