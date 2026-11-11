"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { MenuProductDto } from "@/shared/types/api";
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
    const [showStickyBar, setShowStickyBar] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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

    // Mapa de selecciones: [groupId]: optionId[]
    // En todos los pedidos las opciones son libres, sin techos artificiales ni obligatorias
    const [selections, setSelections] = useState<Record<number, number[]>>(() => {
        const initial: Record<number, number[]> = {};
        for (const group of product.modifierGroups) {
            initial[group.id] = [];
        }
        return initial;
    });

    const handleToggleOption = (groupId: number, optionId: number) => {
        setSelections((prev) => {
            const current = prev[groupId] || [];
            const isSelected = current.includes(optionId);
            return {
                ...prev,
                [groupId]: isSelected
                    ? current.filter((id) => id !== optionId)
                    : [...current, optionId],
            };
        });
    };

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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const isPast = e.currentTarget.scrollTop > 120;
        setShowStickyBar((prev) => (prev !== isPast ? isPast : prev));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 overscroll-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modifier-modal-title"
        >
            <div className="relative w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden text-text-strong animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250 ease-out">
                {/* 1. Botón de Cierre Limpio sin envoltura */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    className="absolute top-2.5 right-3 z-40 p-1.5 flex items-center justify-center text-text-muted hover:text-text-strong transition-colors cursor-pointer active:scale-90"
                >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </button>

                {/* 2. Barra Sticky Superior Flotante (completamente absolute, cero layout shifts) */}
                <div
                    className={`absolute top-0 left-0 right-0 h-12 bg-surface-card/95 backdrop-blur-md border-b border-surface-border px-4 flex items-center justify-between gap-3 z-30 transition-all duration-200 ease-out ${
                        showStickyBar
                            ? "translate-y-0 opacity-100 pointer-events-auto shadow-xs"
                            : "-translate-y-full opacity-0 pointer-events-none"
                    }`}
                >
                    <div className="flex items-center gap-2.5 min-w-0 pr-9">
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                            <Image
                                src={product.imageUrl || "/images/shared/placeholders/dish-default.webp"}
                                alt=""
                                fill
                                sizes="28px"
                                className="object-cover"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-xs text-text-strong truncate uppercase font-display leading-tight">
                                {product.name}
                            </p>
                            <p className="text-[11px] font-mono font-bold text-brand-primary">
                                {formatCurrency(unitTotal)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Contenedor de Desplazamiento Fluido */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain bg-surface-card"
                >
                    {/* Cabecera Hero Compacta (sincronizada con el fondo blanco/oscuro del modal) */}
                    <div className="relative w-full h-36 sm:h-48 bg-surface-card overflow-hidden flex items-center justify-center shrink-0">
                        {/* Imagen principal completa sin fondos borrosos */}
                        <div className="relative w-full h-full p-2.5 sm:p-4 z-1">
                            <Image
                                src={product.imageUrl || "/images/shared/placeholders/dish-default.webp"}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, 512px"
                                className="object-contain object-center"
                                priority
                            />
                        </div>

                        {/* Categoría Limpia sin cápsula ni borde */}
                        <span className="absolute top-3.5 left-4 z-10 text-[11px] font-black uppercase tracking-wider text-text-muted font-display select-none">
                            {product.category}
                        </span>
                    </div>

                    {/* Contenido Interior del Producto */}
                    <div className="p-4 sm:p-6 space-y-4">
                        {/* Información Principal del Plato */}
                        <div className="space-y-1 pb-1">
                            <div className="flex items-start justify-between gap-3">
                                <h2 id="modifier-modal-title" className="text-lg sm:text-2xl font-black text-text-strong uppercase tracking-tight font-display leading-tight">
                                    {product.name}
                                </h2>
                                <span className="text-lg sm:text-2xl font-black text-text-strong font-mono tabular-nums shrink-0">
                                    {formatCurrency(product.basePrice)}
                                </span>
                            </div>
                            {product.description && (
                                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        {/* Lista de Grupos de Modificadores (100% Opcionales y sin cápsulas alrededor de los textos) */}
                        <div className="space-y-4">
                            {product.modifierGroups.map((group) => {
                                const selectedIds = selections[group.id] || [];

                                return (
                                    <div
                                        key={group.id}
                                        id={`modifier-group-${group.id}`}
                                        className="space-y-1.5 scroll-mt-4"
                                    >
                                        {/* Cabecera del Grupo limpia sin líneas separadoras ni restricciones */}
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-black text-text-strong font-display uppercase tracking-wide">
                                                {group.name}
                                            </h3>
                                        </div>

                                        <div className="space-y-1.5">
                                            {group.options
                                                .filter((opt) => !opt.name.trim().toLowerCase().startsWith("sin "))
                                                .map((option) => {
                                                const isSelected = selectedIds.includes(option.id);

                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() => handleToggleOption(group.id, option.id)}
                                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-left text-xs sm:text-sm transition-all duration-150 cursor-pointer min-h-[44px] ${
                                                            isSelected
                                                                ? "border-brand-primary bg-brand-primary/5 shadow-2xs font-semibold"
                                                                : "border-surface-border hover:border-surface-border-subtle bg-surface-card hover:bg-surface-canvas/50"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                            {/* Selector circular consistente todo rojo al marcarse */}
                                                            <div
                                                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                                                    isSelected
                                                                        ? "border-brand-primary bg-brand-primary text-white"
                                                                        : "border-neutral-300 dark:border-neutral-600 bg-surface-card"
                                                                }`}
                                                            >
                                                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                            </div>
                                                            <span
                                                                className={`truncate ${
                                                                    isSelected ? "text-text-strong font-bold" : "text-text-base"
                                                                }`}
                                                            >
                                                                {option.name}
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={`text-xs sm:text-sm font-bold tabular-nums font-mono shrink-0 ${
                                                                option.additionalPrice > 0
                                                                    ? "text-brand-primary font-black"
                                                                    : "text-text-muted"
                                                            }`}
                                                        >
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
                    </div>
                </div>

                {/* Footer Modal Fijo con Agregar al Pedido Inmediato */}
                <div
                    className="p-3 sm:p-4 bg-surface-card flex items-center justify-between gap-3 sm:gap-4 shrink-0 border-t border-surface-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10"
                    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                >
                    {/* Stepper Cantidad */}
                    <div className="flex items-center gap-1 bg-surface-canvas rounded-full p-1 shadow-xs shrink-0">
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-base hover:bg-surface-card hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-90"
                        >
                            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                        </button>
                        <span className="w-6 sm:w-7 text-center text-xs sm:text-base font-black text-text-strong font-mono tabular-nums">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                            aria-label="Aumentar cantidad"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-base hover:bg-surface-card hover:shadow-xs transition-all cursor-pointer active:scale-90"
                        >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Botón Agregar al Pedido Siempre Activo */}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="flex-1 min-w-0 h-11 sm:h-12 flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-wider px-4 sm:px-6 rounded-full shadow-md transition-all font-display gap-2 cursor-pointer bg-brand-primary hover:bg-brand-primary-hover text-white active:scale-95 shadow-brand-primary/20 hover:shadow-lg"
                    >
                        <span className="truncate">Agregar al Pedido</span>
                        <span className="text-xs sm:text-sm font-black tracking-tight font-mono tabular-nums shrink-0">
                            {formatCurrency(lineTotal)}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
