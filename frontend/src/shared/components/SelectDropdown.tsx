"use client";

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, MoreHorizontal } from "lucide-react";

export interface SelectDropdownOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
}

export interface SelectDropdownProps<T extends string = string> {
  options: SelectDropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  triggerLabel?: React.ReactNode;
  triggerAriaLabel?: string;
  align?: "left" | "right";
  className?: string;
  menuClassName?: string;
}

const emptySubscribe = () => () => {};

export function SelectDropdown<T extends string = string>({
  options,
  value,
  onChange,
  triggerLabel,
  triggerAriaLabel = "Ver más opciones",
  align = "left",
  className = "",
  menuClassName = "",
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isSelectedWithin = Boolean(selectedOption);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    if (align === "right") {
      setCoords({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left: Math.max(8, rect.left),
      });
    }
  }, [align]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Actualizar coordenadas al abrir y ante eventos de scroll o resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function onScrollOrResize() {
      updatePosition();
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Cierre al hacer clic o tocar fuera del componente y tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        handleClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const handleSelect = (val: T) => {
    onChange(val);
    handleClose();
  };

  return (
    <div className={`relative inline-block text-left shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={triggerAriaLabel}
        className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider font-display transition-all cursor-pointer select-none active:scale-95 ${
          isSelectedWithin
            ? "bg-brand-primary text-white scale-[1.02]"
            : "bg-surface-card text-text-strong hover:bg-surface-card-hover border border-surface-border"
        }`}
      >
        {triggerLabel ? (
          triggerLabel
        ) : (
          <span className="flex items-center gap-1.5">
            <MoreHorizontal className="w-4 h-4 shrink-0" />
            {isSelectedWithin && selectedOption && (
              <span className="truncate max-w-[110px] sm:max-w-[140px]">
                {selectedOption.label}
              </span>
            )}
          </span>
        )}
      </button>

      {isOpen && isMounted && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: coords.left !== undefined ? `${coords.left}px` : undefined,
              right: coords.right !== undefined ? `${coords.right}px` : undefined,
            }}
            className={`z-50 min-w-[190px] max-w-xs max-h-72 overflow-y-auto rounded-2xl bg-surface-card border border-surface-border shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 focus:outline-hidden ${menuClassName}`}
          >
            {options.map((option) => {
              const isItemActive = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isItemActive}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider text-left transition-colors cursor-pointer ${
                    isItemActive
                      ? "bg-brand-primary text-white"
                      : "text-text-strong hover:bg-surface-canvas hover:text-brand-primary"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isItemActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
