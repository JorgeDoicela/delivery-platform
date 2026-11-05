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
    <div className="py-4 border-b border-surface-border space-y-3">
      {/* Fila principal con toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-strong">
          <Utensils className="w-4 h-4 text-brand-primary" />
          <label
            htmlFor={switchId}
            className="text-xs font-bold font-display uppercase tracking-wider cursor-pointer"
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
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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
        <div className="pl-6 space-y-2 pt-1">
          <label className="flex items-center justify-between text-xs text-text-base cursor-pointer group">
            <span>Salsas</span>
            <input
              type="checkbox"
              checked={utensils.sauces}
              onChange={(e) => setUtensilOption("sauces", e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                utensils.sauces
                  ? "bg-brand-primary text-white"
                  : "border border-surface-border bg-surface-canvas"
              }`}
            >
              {utensils.sauces && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
          </label>

          <label className="flex items-center justify-between text-xs text-text-base cursor-pointer group">
            <span>Cubiertos</span>
            <input
              type="checkbox"
              checked={utensils.cutlery}
              onChange={(e) => setUtensilOption("cutlery", e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                utensils.cutlery
                  ? "bg-brand-primary text-white"
                  : "border border-surface-border bg-surface-canvas"
              }`}
            >
              {utensils.cutlery && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
          </label>

          <label className="flex items-center justify-between text-xs text-text-base cursor-pointer group">
            <span>Servilletas</span>
            <input
              type="checkbox"
              checked={utensils.napkins}
              onChange={(e) => setUtensilOption("napkins", e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                utensils.napkins
                  ? "bg-brand-primary text-white"
                  : "border border-surface-border bg-surface-canvas"
              }`}
            >
              {utensils.napkins && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

