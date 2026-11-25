"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import {
  SUPPORTED_COUNTRIES,
  DEFAULT_COUNTRY,
  type CountryCallingCode,
  parsePhoneNumber,
  formatToE164,
} from "@/shared/lib/phone-countries";

export interface PhoneNumberInputProps {
  value?: string;
  onChange?: (fullE164: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
  defaultCountryCode?: string;
}

export const PhoneNumberInput = React.forwardRef<HTMLInputElement, PhoneNumberInputProps>(
  (
    {
      value = "",
      onChange,
      onBlur,
      id,
      name,
      label,
      required = false,
      disabled = false,
      placeholder,
      error,
      className = "",
      defaultCountryCode,
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `phone-input-${generatedId}`;

    const parsed = parsePhoneNumber(value);
    const initialCountry =
      SUPPORTED_COUNTRIES.find((c) => c.code === defaultCountryCode) || parsed.country || DEFAULT_COUNTRY;

    const [selectedCountry, setSelectedCountry] = useState<CountryCallingCode>(initialCountry);
    const [localNumber, setLocalNumber] = useState<string>(parsed.localNumber);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const lastEmittedRef = useRef<string>(value || "");

    // Sincronizar solo cuando el valor externo cambia desde fuera (ej. carga inicial o reset),
    // evitando bucles de render con onChange y respetando el país elegido por el usuario.
    useEffect(() => {
      const normalizedExternal = value || "";
      if (normalizedExternal === lastEmittedRef.current) {
        return;
      }
      lastEmittedRef.current = normalizedExternal;
      const p = parsePhoneNumber(normalizedExternal);
      setSelectedCountry(p.country);
      setLocalNumber(p.localNumber);
    }, [value]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
          setSearchQuery("");
        }
      };
      if (isDropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        // Focus en buscador
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isDropdownOpen]);

    const handleCountrySelect = (country: CountryCallingCode) => {
      setSelectedCountry(country);
      setIsDropdownOpen(false);
      setSearchQuery("");
      // Si el número existente supera el límite del nuevo país, truncarlo
      const trimmedLocal = localNumber.slice(0, country.maxLength);
      setLocalNumber(trimmedLocal);
      const full = formatToE164(country, trimmedLocal);
      lastEmittedRef.current = full;
      onChange?.(full);
    };

    const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputVal = e.target.value;
      // Si el usuario escribe o pega con 0 inicial (ej: 098...), limpiarlo si ya está seleccionado el país
      if (inputVal.startsWith("0")) {
        inputVal = inputVal.replace(/^0+/, "");
      }
      // Permitir sólo dígitos (sin espacios ni caracteres extra)
      const digitsOnly = inputVal.replace(/\D/g, "");
      // Limitar estrictamente a la longitud máxima del país seleccionado
      const limited = digitsOnly.slice(0, selectedCountry.maxLength);
      setLocalNumber(limited);
      const full = formatToE164(selectedCountry, limited);
      lastEmittedRef.current = full;
      onChange?.(full);
    };

    const filteredCountries = SUPPORTED_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.dialCode.includes(searchQuery) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className={`space-y-1.5 w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
          >
            {label} {required && <span className="text-brand-primary">*</span>}
          </label>
        )}

        <div
          ref={dropdownRef}
          className={`relative flex items-center rounded-xl bg-surface-canvas border transition-all ${
            error
              ? "border-red-500 ring-1 ring-red-500/20"
              : "border-surface-border hover:border-surface-border/80 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary focus-within:bg-surface-card"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          {/* Selector de Prefijo y País */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label={`Seleccionar prefijo de país, actual: ${selectedCountry.name} (${selectedCountry.dialCode})`}
            className="h-[46px] px-3.5 flex items-center gap-1.5 border-r border-surface-border/70 hover:bg-surface-card-hover rounded-l-xl transition-colors cursor-pointer shrink-0 outline-none text-text-strong font-medium text-xs select-none"
          >
            <span className="font-mono text-text-strong font-bold text-sm tracking-tight">{selectedCountry.dialCode}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-text-subtle transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180 text-brand-primary" : ""
              }`}
            />
          </button>

          {/* Input de Número Local con límite estricto maxLength */}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={selectedCountry.maxLength}
            disabled={disabled}
            value={localNumber}
            onChange={handleLocalNumberChange}
            onBlur={onBlur}
            placeholder={placeholder || selectedCountry.placeholder}
            className="w-full h-[46px] px-3.5 bg-transparent text-sm text-text-strong placeholder:text-text-subtle outline-none font-sans font-medium"
          />

          {/* Menú Desplegable con Búsqueda de Países */}
          {isDropdownOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-2 animate-fadeIn space-y-1.5">
              {/* Buscador interno */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-subtle absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar país o prefijo..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-canvas border border-surface-border rounded-xl text-text-strong placeholder:text-text-subtle outline-none focus:border-brand-primary"
                />
              </div>

              {/* Lista scrolleable de países */}
              <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c) => {
                    const isSelected = c.code === selectedCountry.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-brand-primary/10 text-brand-primary font-bold"
                            : "hover:bg-surface-card-hover text-text-strong"
                        }`}
                      >
                        <span className="truncate pr-2 font-medium">{c.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px] text-text-subtle">
                          <span>{c.dialCode}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-primary" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-text-muted">
                    No se encontraron países
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-brand-primary font-semibold leading-tight pt-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PhoneNumberInput.displayName = "PhoneNumberInput";
