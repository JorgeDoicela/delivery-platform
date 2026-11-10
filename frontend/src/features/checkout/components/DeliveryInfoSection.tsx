"use client";

import { useEffect } from "react";
import type { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { User, MapPin, Bookmark } from "lucide-react";
import { useAccountStore } from "@/features/account";
import { useAuthStore } from "@/features/auth";

interface DeliveryInfoSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue?: UseFormSetValue<CheckoutFormData>;
  onLocationSelect?: (lat: number, lng: number) => void;
  errors: FieldErrors<CheckoutFormData>;
}

export function DeliveryInfoSection({
  register,
  setValue,
  onLocationSelect,
  errors,
}: DeliveryInfoSectionProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addresses = useAccountStore((s) => s.addresses);
  const fetchAddresses = useAccountStore((s) => s.fetchAddresses);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  const handleSelectSavedAddress = (addr: (typeof addresses)[0]) => {
    if (!setValue) return;

    const fullStreet = addr.buildingNumber
      ? `${addr.street} #${addr.buildingNumber}`
      : addr.street;
    setValue("addressStreet", fullStreet);

    const refParts: string[] = [];
    if (addr.secondaryStreet) refParts.push(`Intersección: ${addr.secondaryStreet}`);
    if (addr.reference) refParts.push(addr.reference);
    if (refParts.length > 0) {
      setValue("addressReference", refParts.join(". "));
    }

    if (addr.latitude && addr.longitude && onLocationSelect) {
      onLocationSelect(addr.latitude, addr.longitude);
    }
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-surface-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-strong font-display">Datos de Entrega</h3>
          <p className="text-[11px] text-text-muted">
            Información para el repartidor y comanda física de cocina
          </p>
        </div>
      </div>

      {/* Selector rápido de direcciones guardadas para clientes autenticados */}
      {isAuthenticated && addresses.length > 0 && (
        <div className="p-3 bg-surface-canvas rounded-xl border border-surface-border space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
            <Bookmark className="w-3.5 h-3.5 text-brand-primary" />
            <span>Usar Dirección Guardada:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => handleSelectSavedAddress(addr)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-card hover:bg-surface-card-hover border border-surface-border hover:border-brand-primary text-text-strong transition-colors cursor-pointer"
                title={`${addr.street} (Clic para autocompletar)`}
              >
                <MapPin className="w-3 h-3 text-brand-primary" />
                <span>{addr.label}</span>
                {addr.isDefault && (
                  <span className="text-[9px] font-bold text-text-muted uppercase">(Predeterminada)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-text-base mb-1">
            Nombre Completo *
          </label>
          <input
            {...register("customerName")}
            placeholder="Ej. Carlos Mendoza"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-surface-card text-text-strong"
          />
          {errors.customerName && (
            <p className="text-[11px] text-status-danger mt-1 font-medium">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-text-base mb-1">
            Teléfono Celular *
          </label>
          <input
            {...register("customerPhone")}
            placeholder="Ej. 0987654321"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-surface-card text-text-strong"
          />
          {errors.customerPhone && (
            <p className="text-[11px] text-status-danger mt-1 font-medium">
              {errors.customerPhone.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-text-base mb-1">
            Dirección Exacta (Calle y Número) *
          </label>
          <input
            {...register("addressStreet")}
            placeholder="Ej. Av. Amazonas N34-120 y República"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-surface-card text-text-strong"
          />
          {errors.addressStreet && (
            <p className="text-[11px] text-status-danger mt-1 font-medium">
              {errors.addressStreet.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-text-base mb-1">
            Referencia de Despacho (Edificio, Timbre, Color)
          </label>
          <input
            {...register("addressReference")}
            placeholder="Ej. Edificio Sky, Timbre 4B, junto a la farmacia"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-surface-card text-text-strong"
          />
        </div>
      </div>
    </div>
  );
}

