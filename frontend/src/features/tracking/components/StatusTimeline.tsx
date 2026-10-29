'use client';

import { OrderStatus } from '@/shared/types/api';
import { CheckCircle2 } from 'lucide-react';

interface StatusTimelineProps {
  status: OrderStatus;
}

const statusStepMap: Record<OrderStatus, number> = {
  [OrderStatus.Created]: 1,
  [OrderStatus.PendingValidation]: 1,
  [OrderStatus.Confirmed]: 1,
  [OrderStatus.InKitchen]: 2,
  [OrderStatus.ReadyForDelivery]: 3,
  [OrderStatus.OnTheWay]: 4,
  [OrderStatus.Delivered]: 5,
  [OrderStatus.Cancelled]: -1,
};

const steps = [
  { step: 1, label: 'Recibido' },
  { step: 2, label: 'En Cocina' },
  { step: 3, label: 'Empacado' },
  { step: 4, label: 'En Camino' },
  { step: 5, label: 'Entregado' },
];

export function StatusTimeline({ status }: StatusTimelineProps) {
  if (status === OrderStatus.Cancelled) {
    return (
      <div className="p-4 bg-status-danger/20 border border-status-danger/40 rounded-xl text-center text-xs text-status-danger font-semibold">
        Esta orden ha sido cancelada.
      </div>
    );
  }

  const currentStep = statusStepMap[status] ?? 1;

  return (
    <div className="pt-4">
      <div className="grid grid-cols-5 gap-2 relative">
        {steps.map((s) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-status-success text-text-inverse-strong'
                    : isCurrent
                    ? 'bg-brand-primary text-white scale-110 shadow-lg'
                    : 'bg-surface-canvas border border-surface-border text-text-muted'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : s.step}
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider leading-tight ${
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
