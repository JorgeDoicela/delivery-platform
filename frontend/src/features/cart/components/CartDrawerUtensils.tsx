"use client";

import React, { useId } from "react";
import { Utensils, Check } from "lucide-react";
import { useCartStore } from "../store/useCartStore";

export function CartDrawerUtensils() {
  const utensils = useCartStore((s) => s.utensils);
  const setUtensilsEnabled = useCartStore((s) => s.setUtensilsEnabled);
  const setUtensilOption = useCartStore((s) => s.setUtensilOption);

  const switchId = useId();

  return (
    <div className="p-4 rounded-2xl bg-surface-canvas/60 border border-surface-border space-y-3 shadow-2xs">
      {/* Fila principal con toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-text-strong">
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
          <label
            htmlFor={switchId}
            className="text-xs font-black font-display uppercase tracking-wider cursor-pointer"
          >
            ¿Quieres añadir utensilios?
          </label>
        </div>

        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={utensils.enabled}
          onClick={() => setUtensilsEnabled(!utensils.enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            utensils.enabled ? "bg-brand-primary" : "bg-neutral-300 dark:bg-neutral-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              utensils.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Opciones desplegables cuando el switch está activo */}
      {utensils.enabled && (
        <div className="pt-2 border-t border-surface-border/60 space-y-2">
          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-card transition-colors text-xs text-text-strong font-medium cursor-pointer">
            <span>Salsas y aderezos</span>
            <input
              type="checkbox"
              checked={utensils.sauces}
              onChange={(e) => setUtensilOption("sauces", e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                utensils.sauces
                  ? "bg-brand-primary text-white"
                  : "border-2 border-surface-border bg-surface-card"
              }`}
            >
              {utensils.sauces && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-card transition-colors text-xs text-text-strong font-medium cursor-pointer">
            <span>Cubiertos desechables</span>
            <input
              type="checkbox"
              checked={utensils.cutlery}
              onChange={(e) => setUtensilOption("cutlery", e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                utensils.cutlery
                  ? "bg-brand-primary text-white"
                  : "border-2 border-surface-border bg-surface-card"
              }`}
            >
              {utensils.cutlery && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-card transition-colors text-xs text-text-strong font-medium cursor-pointer">
            <span>Servilletas</span>
            <input
              type="checkbox"
              checked={utensils.napkins}
              onChange={(e) => setUtensilOption("napkins", e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                utensils.napkins
                  ? "bg-brand-primary text-white"
                  : "border-2 border-surface-border bg-surface-card"
              }`}
            >
              {utensils.napkins && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
