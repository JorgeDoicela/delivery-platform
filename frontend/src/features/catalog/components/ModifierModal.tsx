"use client";

import { useState } from "react";
import Image from "next/image";
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
    const openCart = useCartStore((s) => s.openCart);
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
        openCart();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] overflow-hidden text-text-strong">
                {/* Header Modal Fijo y Opaco */}
                <div className="p-4 sm:p-6 border-b border-surface-border flex items-start justify-between gap-3 sm:gap-4 shrink-0 bg-surface-card z-10">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-surface-canvas shrink-0 border border-surface-border">
                            <Image
                                src={product.imageUrl || "/images/shared/placeholders/dish-default.webp"}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 56px, 80px"
                                className="object-cover"
                            />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-strong bg-surface-canvas border border-surface-border px-2.5 py-0.5 rounded-full inline-block truncate max-w-full">
                                {product.category}
                            </span>
                            <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-text-strong mt-1.5 font-display leading-tight truncate">
                                {product.name}
                            </h3>
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                                {product.description}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-card-hover text-text-muted hover:text-text-strong transition-colors shrink-0 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Grupos de Modificadores Desplazables (Sin superposición, altura calculada exacta) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar overscroll-contain bg-surface-card">
                    {product.modifierGroups.map((group) => {
                        const selectedIds = selections[group.id] || [];
                        const isGroupValid = !group.isRequired || selectedIds.length >= group.minSelectable;

                        return (
                            <div key={group.id} className="space-y-3">
                                <div className="flex items-center justify-between pb-1.5 border-b border-surface-border-subtle">
                                    <div>
                                        <h4 className="text-sm font-bold text-text-strong font-display uppercase tracking-wide">
                                            {group.name}
                                        </h4>
                                        <p className="text-[11px] text-text-muted">
                                            {group.maxSelectable === 1
                                                ? "Selecciona 1 opción"
                                                : `Elige hasta ${group.maxSelectable} opciones`}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${group.isRequired
                                                ? isGroupValid
                                                    ? "bg-status-success-bg text-status-success"
                                                    : "bg-status-warning-bg text-status-warning"
                                                : "bg-surface-canvas text-text-muted border border-surface-border"
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
                                                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${isSelected
                                                        ? "border-2 border-brand-primary bg-surface-card shadow-xs ring-1 ring-brand-primary/20"
                                                        : "border-surface-border hover:border-surface-border-subtle bg-surface-card"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                                                ? "border-brand-primary bg-brand-primary text-white"
                                                                : "border-surface-border bg-surface-card"
                                                            }`}
                                                    >
                                                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                    </div>
                                                    <span
                                                        className={`font-medium ${isSelected ? "text-text-strong font-bold" : "text-text-base"
                                                            }`}
                                                    >
                                                        {option.name}
                                                    </span>
                                                </div>

                                                <span className="font-bold text-text-muted tabular-nums font-mono">
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

                {/* Footer Modal Fijo y 100% Opaco (Nunca se superpone con las opciones) */}
                <div
                    className="p-3.5 sm:p-6 bg-surface-card border-t border-surface-border flex items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-md z-10"
                    style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
                >
                    {/* Stepper Cantidad */}
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-surface-canvas border border-surface-border rounded-full p-1 shadow-2xs shrink-0">
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-base hover:bg-surface-card-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-5 sm:w-6 text-center text-sm font-black text-text-strong font-mono tabular-nums">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                            aria-label="Aumentar cantidad"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-base hover:bg-surface-card-hover transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Botón Agregar */}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!isValid}
                        className="flex-1 min-w-0 flex items-center justify-between bg-brand-primary hover:bg-brand-primary-hover disabled:bg-surface-border disabled:text-text-muted text-white text-xs font-black uppercase tracking-wider py-3.5 sm:py-4 px-4 sm:px-6 rounded-full shadow-md transition-all hover:scale-[1.01] active:scale-95 disabled:active:scale-100 cursor-pointer font-display gap-2"
                    >
                        <span className="truncate">{isValid ? "Agregar al Pedido" : "Opciones requeridas"}</span>
                        <span className="text-xs sm:text-sm font-black tracking-tight font-mono tabular-nums shrink-0">
                            {formatCurrency(lineTotal)}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
