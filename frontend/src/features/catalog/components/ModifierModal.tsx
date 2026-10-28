"use client";

import { useState } from "react";
import type { MenuProductDto, MenuModifierGroupDto } from "@/shared/types/api";
import { useCartStore, type SelectedModifier } from "@/features/cart";
import { formatCurrency } from "@/shared/lib/utils";
import { X, Plus, Minus, Check } from "lucide-react";

interface ModifierModalProps {
  product: MenuProductDto;
  onClose: () => void;
}

export function ModifierModal({ product, onClose }: ModifierModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  // Mapa de selecciones: [groupId]: Set<optionId>
  const [selections, setSelections] = useState<Record<number, number[]>>(() => {
    const initial: Record<number, number[]> = {};
    for (const group of product.modifierGroups) {
      if (group.isRequired && group.minSelectable === 1 && group.options.length > 0) {
        // Seleccionar por defecto la primera opción disponible
        initial[group.id] = [group.options[0].id];
      } else {
        initial[group.id] = [];
      }
    }
    return initial;
  });

  const handleToggleOption = (group: MenuModifierGroupDto, optionId: number) => {
    setSelections((prev) => {
      const current = prev[group.id] || [];
      const isSelected = current.includes(optionId);

      // Selección única (Radio)
      if (group.maxSelectable === 1) {
        return {
          ...prev,
          [group.id]: [optionId],
        };
      }

      // Selección múltiple (Checkbox)
      if (isSelected) {
        return {
          ...prev,
          [group.id]: current.filter((id) => id !== optionId),
        };
      } else {
        if (current.length < group.maxSelectable) {
          return {
            ...prev,
            [group.id]: [...current, optionId],
          };
        }
        return prev;
      }
    });
  };

  // Validar si todos los grupos obligatorios cumplen con el mínimo requerido
  const isValid = product.modifierGroups.every((group) => {
    if (!group.isRequired) return true;
    const selectedCount = (selections[group.id] || []).length;
    return selectedCount >= group.minSelectable;
  });

  // Calcular precio de modificadores adicionales
  const allSelectedOptions = product.modifierGroups.flatMap((group) => {
    const selectedIds = selections[group.id] || [];
    return group.options
      .filter((opt) => selectedIds.includes(opt.id))
      .map((opt): SelectedModifier => ({
        id: opt.id,
        name: opt.name,
        price: opt.additionalPrice,
        groupName: group.name,
      }));
  });

  const modifiersTotal = allSelectedOptions.reduce((acc, m) => acc + m.price, 0);
  const unitTotal = product.basePrice + modifiersTotal;
  const lineTotal = unitTotal * quantity;

  const handleAddToCart = () => {
    if (!isValid) return;

    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.basePrice,
      imageUrl: product.imageUrl,
      quantity,
      selectedModifiers: allSelectedOptions,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              {product.category}
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {product.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grupos de Modificadores (Scroll) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {product.modifierGroups.map((group) => {
            const selectedIds = selections[group.id] || [];
            const isGroupValid = !group.isRequired || selectedIds.length >= group.minSelectable;

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {group.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {group.maxSelectable === 1
                        ? "Selecciona 1 opción"
                        : `Elige hasta ${group.maxSelectable} opciones`}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      group.isRequired
                        ? isGroupValid
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-orange-50 text-orange-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {group.isRequired ? (isGroupValid ? "Completado" : "Obligatorio") : "Opcional"}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggleOption(group, option.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/50 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-orange-600 bg-orange-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span
                            className={`font-medium ${
                              isSelected ? "text-slate-900 font-bold" : "text-slate-700"
                            }`}
                          >
                            {option.name}
                          </span>
                        </div>

                        <span className="font-semibold text-slate-600">
                          {option.additionalPrice > 0
                            ? `+ ${formatCurrency(option.additionalPrice)}`
                            : "Incluido"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Modal: Cantidad y Botón de Acción */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          {/* Stepper Cantidad */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Agregar */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isValid}
            className="flex-1 flex items-center justify-between bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white text-xs font-bold py-3.5 px-5 rounded-xl shadow-md transition-all active:scale-95 disabled:active:scale-100"
          >
            <span>{isValid ? "Agregar al Pedido" : "Selecciona las opciones obligatorias"}</span>
            <span className="text-sm font-black tracking-tight">
              {formatCurrency(lineTotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
