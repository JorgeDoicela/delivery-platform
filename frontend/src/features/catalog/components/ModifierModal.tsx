"use client";

import { useState, useEffect } from "react";
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

    // Bloqueo estricto del scroll del fondo (body scroll lock) y soporte de tecla Escape
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

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
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overscroll-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modifier-modal-title"
        >
            <div className="relative w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden text-text-strong animate-in zoom-in-95 duration-200">
                {/* Cabecera Hero Fotográfica Gastronómica */}
                <div className="relative w-full h-48 sm:h-60 bg-neutral-950 overflow-hidden shrink-0 flex items-center justify-center">
                    {/* Fondo ambiental difuminado para rellenar márgenes de forma armoniosa */}
                    <Image
                        src={product.imageUrl || "/images/shared/placeholders/dish-default.webp"}
                        alt=""
                        aria-hidden="true"
                        fill
                        className="object-cover object-center blur-2xl opacity-40 scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Imagen principal completa sin recortes */}
                    <div className="relative w-full h-full p-3 sm:p-4 z-1">
                        <Image
                            src={product.imageUrl || "/images/shared/placeholders/dish-default.webp"}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 512px"
                            className="object-contain object-center"
                            priority
                        />
                    </div>

                    {/* Badge de Categoría Superior Izquierdo */}
                    <span className="absolute top-3.5 left-3.5 z-10 text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full shadow-md font-sans">
                        {product.category}
                    </span>

                    {/* Botón de Cierre Flotante Superior Derecho */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                    >
                        <X className="w-5 h-5 stroke-[2.5]" />
                    </button>
                </div>

                {/* Contenido Desplazable del Producto y Modificadores */}
                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar overscroll-contain bg-surface-card">
                    {/* Información Principal del Plato */}
                    <div className="space-y-1.5 pb-2">
                        <div className="flex items-start justify-between gap-4">
                            <h2 id="modifier-modal-title" className="text-xl sm:text-2xl font-black text-text-strong uppercase tracking-tight font-display leading-tight">
                                {product.name}
                            </h2>
                            <span className="text-xl sm:text-2xl font-black text-text-strong font-mono tabular-nums shrink-0">
                                {formatCurrency(product.basePrice)}
                            </span>
                        </div>
                        {product.description && (
                            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                                {product.description}
                            </p>
                        )}
                    </div>

                    {/* Grupos de Modificadores */}
                    {product.modifierGroups.map((group) => {
                        const selectedIds = selections[group.id] || [];
                        const isGroupValid = !group.isRequired || selectedIds.length >= group.minSelectable;

                        return (
                            <div key={group.id} className="space-y-3">
                                <div className="flex items-center justify-between pb-1.5 border-b border-surface-border-subtle">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm sm:text-base font-black text-text-strong font-display uppercase tracking-wide">
                                                {group.name}
                                            </h3>
                                            {group.isRequired && !isGroupValid && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                                                    Requerido
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-text-muted mt-0.5">
                                            {group.maxSelectable === 1
                                                ? "Selecciona 1 opción"
                                                : `Elige hasta ${group.maxSelectable} opciones`}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                            group.isRequired
                                                ? isGroupValid
                                                    ? "bg-status-success-bg text-status-success"
                                                    : "bg-status-warning-bg text-status-warning"
                                                : "bg-surface-canvas text-text-muted border border-surface-border"
                                        }`}
                                    >
                                        {group.isRequired ? (isGroupValid ? "Listo" : "Obligatorio") : "Opcional"}
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
                                                className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                                                    isSelected
                                                        ? "border-2 border-brand-primary bg-brand-primary/5 shadow-xs"
                                                        : "border-surface-border hover:border-surface-border-subtle bg-surface-card hover:bg-surface-canvas/50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                                            isSelected
                                                                ? "border-brand-primary bg-brand-primary text-white shadow-xs scale-105"
                                                                : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                    <span
                                                        className={`font-medium ${
                                                            isSelected ? "text-text-strong font-bold" : "text-text-base"
                                                        }`}
                                                    >
                                                        {option.name}
                                                    </span>
                                                </div>

                                                <span className={`text-xs sm:text-sm font-bold tabular-nums font-mono ${
                                                    option.additionalPrice > 0 ? "text-brand-primary font-black" : "text-text-muted"
                                                }`}>
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

                {/* Footer Modal Fijo y 100% Opaco */}
                <div
                    className="p-4 sm:p-5 bg-surface-card flex items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10"
                    style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
                >
                    {/* Stepper Cantidad */}
                    <div className="flex items-center gap-1 bg-surface-canvas rounded-full p-1 shadow-xs shrink-0">
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-base hover:bg-surface-card hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-90"
                        >
                            <Minus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <span className="w-6 sm:w-7 text-center text-sm sm:text-base font-black text-text-strong font-mono tabular-nums">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                            aria-label="Aumentar cantidad"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-base hover:bg-surface-card hover:shadow-xs transition-all cursor-pointer active:scale-90"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Botón Agregar al Pedido */}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!isValid}
                        className="flex-1 min-w-0 h-11 sm:h-12 flex items-center justify-between bg-brand-primary hover:bg-brand-primary-hover disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white text-xs sm:text-sm font-black uppercase tracking-wider px-5 sm:px-6 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:active:scale-100 cursor-pointer font-display gap-2"
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
