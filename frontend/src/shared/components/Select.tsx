"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SelectProps<T extends string | number = string> {
  options: SelectOption<T>[];
  value?: T | null;
  defaultValue?: T;
  onChange?: (value: T) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "surface";
  leftIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

export interface SelectHandle {
  focus: () => void;
  open: () => void;
  close: () => void;
}

const SIZE_STYLES = {
  sm: {
    trigger: "min-h-[36px] px-3 py-1.5 text-xs rounded-xl",
    icon: "w-3.5 h-3.5",
    menuItem: "px-3 py-2 text-xs rounded-lg",
  },
  md: {
    trigger: "min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl",
    icon: "w-4 h-4",
    menuItem: "px-3.5 py-2.5 text-xs sm:text-sm rounded-xl",
  },
  lg: {
    trigger: "min-h-[50px] px-4 py-3 text-sm sm:text-base rounded-2xl",
    icon: "w-4 h-4 sm:w-5 sm:h-5",
    menuItem: "px-4 py-3 text-sm rounded-xl",
  },
};

function InnerSelect<T extends string | number = string>(
  {
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    onBlur,
    name,
    id: explicitId,
    label,
    placeholder = "Seleccionar opción...",
    helperText,
    error,
    disabled = false,
    required = false,
    searchable = false,
    searchPlaceholder = "Buscar...",
    clearable = false,
    size = "md",
    variant = "default",
    leftIcon: LeftIcon,
    className = "",
    triggerClassName = "",
    menuClassName = "",
  }: SelectProps<T>,
  ref: React.ForwardedRef<SelectHandle>
) {
  const generatedId = useId();
  const selectId = explicitId || generatedId;
  const labelId = `${selectId}-label`;
  const listboxId = `${selectId}-listbox`;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  const [internalValue, setInternalValue] = useState<T | null>(
    controlledValue !== undefined
      ? controlledValue
      : defaultValue !== undefined
      ? defaultValue
      : null
  );

  const currentValue =
    controlledValue !== undefined ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom");

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => triggerRef.current?.focus(),
    open: () => {
      if (!disabled) setIsOpen(true);
    },
    close: () => setIsOpen(false),
  }));

  const selectedOption = options.find((opt) => opt.value === currentValue);

  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : options;

  const handleOpen = useCallback(() => {
    if (disabled) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedMenuHeight = 240;

      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }

    setIsOpen(true);
    setSearchQuery("");
    const selectedIdx = filteredOptions.findIndex(
      (opt) => opt.value === currentValue
    );
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [disabled, filteredOptions, currentValue]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    onBlur?.();
  }, [onBlur]);

  const handleSelectOption = useCallback(
    (option: SelectOption<T>) => {
      if (option.disabled) return;
      if (controlledValue === undefined) {
        setInternalValue(option.value);
      }
      onChange?.(option.value);
      handleClose();
      triggerRef.current?.focus();
    },
    [controlledValue, onChange, handleClose]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      if (controlledValue === undefined) {
        setInternalValue(null);
      }
      if (options.length > 0) {
        onChange?.("" as unknown as T);
      }
      handleClose();
      triggerRef.current?.focus();
    },
    [disabled, controlledValue, options.length, onChange, handleClose]
  );

  // Cierre por clic exterior
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, handleClose]);

  // Enfocar input de búsqueda al abrir si es searchable
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Navegación por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        handleClose();
        triggerRef.current?.focus();
        break;
      case "ArrowDown": {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < filteredOptions.length && filteredOptions[next]?.disabled) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next]?.disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      }
      case "Enter":
      case " ":
        if (!searchable || e.key === "Enter") {
          e.preventDefault();
          const targetOption = filteredOptions[highlightedIndex];
          if (targetOption && !targetOption.disabled) {
            handleSelectOption(targetOption);
          }
        }
        break;
      case "Tab":
        handleClose();
        break;
    }
  };

  const currentSize = SIZE_STYLES[size];
  const hasError = Boolean(error);

  const baseBackground =
    variant === "surface" ? "bg-surface-card" : "bg-surface-canvas";

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Input hidden para formularios convencionales / react-hook-form */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue !== null && currentValue !== undefined ? String(currentValue) : ""}
        />
      )}

      {/* Label superior */}
      {label && (
        <label
          id={labelId}
          htmlFor={selectId}
          className="block text-xs font-bold text-text-strong uppercase tracking-wider mb-1.5"
        >
          {label}
          {required && <span className="text-brand-primary ml-1">*</span>}
        </label>
      )}

      {/* Botón Disparador del Select */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className={`w-full flex items-center justify-between gap-2 border transition-all cursor-pointer ${
          currentSize.trigger
        } ${baseBackground} ${
          hasError
            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            : isOpen
            ? "border-brand-primary ring-1 ring-brand-primary shadow-xs"
            : "border-surface-border hover:border-neutral-400 dark:hover:border-neutral-600"
        } ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800"
            : ""
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {LeftIcon && (
            <LeftIcon
              className={`shrink-0 text-text-muted ${currentSize.icon}`}
            />
          )}

          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && (
                <selectedOption.icon className={`shrink-0 ${currentSize.icon}`} />
              )}
              <span className="font-semibold text-text-strong truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-canvas border border-surface-border text-text-muted">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-text-muted truncate font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Limpiar selección"
              onClick={handleClear}
              className="p-1 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`${currentSize.icon} text-text-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-brand-primary" : ""
            }`}
          />
        </div>
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 rounded-2xl bg-surface-card border border-surface-border shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 ${
            dropdownPosition === "top"
              ? "bottom-full mb-1.5"
              : "top-full mt-1.5"
          } ${menuClassName}`}
        >
          {/* Campo de búsqueda opcional */}
          {searchable && (
            <div className="p-1.5 mb-1 border-b border-surface-border">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface-canvas border border-surface-border text-text-strong placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          )}

          {/* Lista de opciones accesibles */}
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={label ? labelId : undefined}
            className="max-h-60 overflow-y-auto space-y-0.5 focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-4 text-center text-xs text-text-muted">
                No se encontraron opciones
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === currentValue;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => {
                      if (!opt.disabled) setHighlightedIndex(idx);
                    }}
                    className={`flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      currentSize.menuItem
                    } ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed pointer-events-none"
                        : isSelected
                        ? "bg-brand-primary text-white font-bold"
                        : isHighlighted
                        ? "bg-surface-canvas text-brand-primary font-semibold"
                        : "text-text-strong hover:bg-surface-canvas"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && (
                        <opt.icon
                          className={`shrink-0 ${currentSize.icon} ${
                            isSelected ? "text-white" : "text-text-muted"
                          }`}
                        />
                      )}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description && (
                          <span
                            className={`block text-[11px] font-normal truncate ${
                              isSelected
                                ? "text-white/80"
                                : "text-text-muted"
                            }`}
                          >
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-surface-canvas border border-surface-border text-text-muted"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-white" />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Mensaje de error de validación */}
      {hasError && (
        <p
          id={errorId}
          className="mt-1 text-xs text-red-500 font-semibold tracking-wide"
        >
          {error}
        </p>
      )}

      {/* Texto de ayuda explicativo */}
      {!hasError && helperText && (
        <p
          id={helperId}
          className="mt-1 text-[11px] text-text-muted font-medium"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export const Select = forwardRef(InnerSelect) as <
  T extends string | number = string
>(
  props: SelectProps<T> & { ref?: React.ForwardedRef<SelectHandle> }
) => React.ReactElement;
