"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { User } from "lucide-react";

interface DeliveryInfoSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
}

export function DeliveryInfoSection({ register, errors }: DeliveryInfoSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Datos de Entrega</h3>
          <p className="text-[11px] text-slate-500">
            Información para el repartidor y comanda física de cocina
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nombre Completo *
          </label>
          <input
            {...register("customerName")}
            placeholder="Ej. Carlos Mendoza"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          {errors.customerName && (
            <p className="text-[11px] text-red-500 mt-1 font-medium">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Teléfono Celular *
          </label>
          <input
            {...register("customerPhone")}
            placeholder="Ej. 0987654321"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          {errors.customerPhone && (
            <p className="text-[11px] text-red-500 mt-1 font-medium">
              {errors.customerPhone.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Dirección Exacta (Calle y Número) *
          </label>
          <input
            {...register("addressStreet")}
            placeholder="Ej. Av. Amazonas N34-120 y República"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          {errors.addressStreet && (
            <p className="text-[11px] text-red-500 mt-1 font-medium">
              {errors.addressStreet.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Referencia de Despacho (Edificio, Timbre, Color)
          </label>
          <input
            {...register("addressReference")}
            placeholder="Ej. Edificio Sky, Timbre 4B, junto a la farmacia"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>
    </div>
  );
}

