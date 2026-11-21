'use client';

import { DeliveryType, OrderStatus } from '@/shared/types/api';
import { CheckCircle2 } from 'lucide-react';

interface StatusTimelineProps {
  status: OrderStatus;
  useKitchenWorkflow?: boolean;
  deliveryType?: DeliveryType;
}

interface TimelineStep {
  key: string;
  label: string;
  statuses: OrderStatus[];
}

export function StatusTimeline({
  status,
  useKitchenWorkflow = true,
  deliveryType = DeliveryType.Delivery,
}: StatusTimelineProps) {
  if (status === OrderStatus.Cancelled) {
    return (
      <div className="p-4 bg-status-danger/20 border border-status-danger/40 rounded-xl text-center text-xs text-status-danger font-semibold">
        Esta orden ha sido cancelada.
      </div>
    );
  }

  const isTakeout = deliveryType === DeliveryType.Takeout;
  const showKitchenStep = useKitchenWorkflow || status === OrderStatus.InKitchen;

  const steps: TimelineStep[] = [
    {
      key: 'received',
      label: 'Recibido',
      statuses: [OrderStatus.Created, OrderStatus.PendingValidation, OrderStatus.Confirmed],
    },
    ...(showKitchenStep
      ? [
          {
            key: 'kitchen',
            label: 'En Cocina',
            statuses: [OrderStatus.InKitchen],
          },
        ]
      : []),
    {
      key: 'ready',
      label: isTakeout ? 'Listo en Local' : 'Empacado',
      statuses: [OrderStatus.ReadyForDelivery],
    },
    ...(!isTakeout
      ? [
          {
            key: 'way',
            label: 'En Camino',
            statuses: [OrderStatus.OnTheWay],
          },
        ]
      : []),
    {
      key: 'delivered',
      label: 'Entregado',
      statuses: [OrderStatus.Delivered],
    },
  ];

  const currentIdx = Math.max(
    0,
    steps.findIndex((s) => s.statuses.includes(status))
  );

  const gridColsClass =
    steps.length === 3
      ? 'grid-cols-3'
      : steps.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-5';

  return (
    <div className="pt-4">
      <div className={`grid ${gridColsClass} gap-2 relative`}>
        {steps.map((s, idx) => {
          const isCompleted = currentIdx > idx;
          const isCurrent = currentIdx === idx;

          return (
            <div key={s.key} className="flex flex-col items-center text-center">
              <div
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 sm:mb-2 transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-status-success text-white'
                    : isCurrent
                    ? 'bg-brand-primary text-white scale-110 shadow-lg'
                    : 'bg-surface-canvas border border-surface-border text-text-muted'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] uppercase tracking-wider leading-tight max-w-full break-words ${
                  isCurrent ? 'text-brand-primary font-black' : isCompleted ? 'text-text-strong font-bold' : 'text-text-muted font-medium'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
