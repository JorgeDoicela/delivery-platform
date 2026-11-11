"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { useAccountStore } from "@/features/account";
import { useAuthStore } from "@/features/auth";
import { useCartStore } from "@/features/cart";
import { useCurrentTenantQuery } from "@/features/tenant";
import { apiClient } from "@/shared/lib/api-client";
import { formatCurrency } from "@/shared/lib/utils";
import { reverseGeocode } from "@/shared/lib/geocoding";
import type { BranchCoverageDto, BranchCapacityResponse } from "@/shared/types/api";
import { AddressSelector } from "./AddressSelector";
import {
  Truck,
  Store,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Bookmark,
  Clock,
} from "lucide-react";

interface DeliveryInfoSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  watch: UseFormWatch<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  coords: { lat: number; lng: number } | null;
  onLocationResolved: (lat: number, lng: number) => void;
}

export function DeliveryInfoSection({
  register,
  setValue,
  watch,
  errors,
  coords,
  onLocationResolved,
}: DeliveryInfoSectionProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addresses = useAccountStore((s) => s.addresses);
  const fetchAddresses = useAccountStore((s) => s.fetchAddresses);

  const cartBranchId = useCartStore((s) => s.branchId);
  const setBranch = useCartStore((s) => s.setBranch);
  const setCartDeliveryType = useCartStore((s) => s.setDeliveryType);
  const tenantSlug = useCartStore((s) => s.tenantSlug);

  const { data: tenant } = useCurrentTenantQuery(tenantSlug);
  const branches = useMemo(() => tenant?.branches ?? [], [tenant?.branches]);
  const hasMultipleBranches = branches.length > 1;
  const baseDeliveryFee = tenant?.baseDeliveryFee ?? 1.5;

  const currentDeliveryType = watch("deliveryType");
  const isDelivery = currentDeliveryType === 1;
  const watchedAddressStreet = watch("addressStreet");

  // Estados de validación de cobertura
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [resolvedBranch, setResolvedBranch] = useState<BranchCoverageDto | null>(null);
  const [branchCapacity, setBranchCapacity] = useState<BranchCapacityResponse | null>(null);

  // Cargar direcciones guardadas si el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  // Sincronizar sucursal por defecto si no hay sucursal activa en carrito
  const firstBranch = branches[0];
  const firstBranchId = firstBranch?.id;
  const firstBranchName = firstBranch?.name;

  useEffect(() => {
    if (firstBranchId && firstBranchName && !cartBranchId) {
      setBranch(firstBranchId, firstBranchName);
    }
  }, [firstBranchId, firstBranchName, cartBranchId, setBranch]);

  // Validación de coordenadas mediante la API de Geofencing
  const validateCoordinates = useCallback(
    async (lat: number, lng: number) => {
      setIsValidatingLocation(true);
      setCoverageError(null);

      try {
        const branch = await apiClient.resolveBranch(lat, lng);
        setResolvedBranch(branch);
        setBranch(branch.branchId, branch.branchName);
        onLocationResolved(lat, lng);

        // Geocodificación inversa automática para que el cliente no deba escribir la calle
        try {
          const detectedStreet = await reverseGeocode(lat, lng);
          setValue("addressStreet", detectedStreet, { shouldValidate: true });
        } catch {
          setValue("addressStreet", `Ubicación GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { shouldValidate: true });
        }

        try {
          const cap = await apiClient.getBranchCapacity(branch.branchId);
          setBranchCapacity(cap);
        } catch {
          // Tolerancia a desconexión volátil de Redis
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "La ubicación seleccionada está fuera de nuestra zona de cobertura. Puedes ajustar el punto o elegir Retiro en Local.";
        setCoverageError(message);
        setResolvedBranch(null);
        setBranchCapacity(null);
      } finally {
        setIsValidatingLocation(false);
      }
    },
    [setBranch, onLocationResolved, setValue]
  );

  // Cambio de modalidad (Delivery vs Retiro en Local)
  const handleModeChange = (mode: "delivery" | "takeout") => {
    if (mode === "delivery") {
      setValue("deliveryType", 1);
      setCartDeliveryType("delivery");
      setValue("addressStreet", "");
    } else {
      setValue("deliveryType", 2);
      setCartDeliveryType("takeout");

      // En Retiro en Local, autocompletamos con la sucursal seleccionada
      const activeBranch = branches.find((b) => b.id === cartBranchId) || branches[0];
      if (activeBranch) {
        setValue("addressStreet", `Retiro en mostrador - Sede ${activeBranch.name}`);
        setValue("addressReference", activeBranch.address);
      }
    }
  };

  // Autocompletar con dirección guardada del usuario
  const handleSelectSavedAddress = (addr: (typeof addresses)[0]) => {
    const fullStreet = addr.buildingNumber
      ? `${addr.street} #${addr.buildingNumber}`
      : addr.street;
    setValue("addressStreet", fullStreet);

    const refParts: string[] = [];
    if (addr.secondaryStreet) refParts.push(`Intersección: ${addr.secondaryStreet}`);
    if (addr.reference) refParts.push(addr.reference);
    if (refParts.length > 0) {
      setValue("addressReference", refParts.join(". "));
    }

    if (addr.latitude && addr.longitude) {
      validateCoordinates(addr.latitude, addr.longitude);
    }
  };

  // Sucursal activa actual para información de retiro o entrega
  const currentBranch = branches.find((b) => b.id === cartBranchId) || branches[0];
  const initialMapLat = coords?.lat ?? currentBranch?.latitude ?? -0.33228;
  const initialMapLng = coords?.lng ?? currentBranch?.longitude ?? -78.557082;

  return (
    <div className="space-y-6">
      {/* 1. Selector Superior de Modalidad: Entrega a Domicilio vs Retiro en Local */}
      <div>
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 font-display">
          ¿Cómo deseas recibir tu pedido?
        </label>
        <div className="grid grid-cols-2 p-1 bg-surface-canvas rounded-xl border border-surface-border">
          <button
            type="button"
            onClick={() => handleModeChange("delivery")}
            className={`py-2.5 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-display uppercase tracking-wide ${
              isDelivery
                ? "bg-white text-text-strong shadow-xs border border-surface-border"
                : "text-text-muted hover:text-text-strong"
            }`}
          >
            <Truck className={`w-4 h-4 ${isDelivery ? "text-brand-primary" : "text-text-muted"}`} />
            <span>A Domicilio</span>
            <span className="text-[11px] font-mono text-brand-primary font-bold">
              ({formatCurrency(baseDeliveryFee)})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("takeout")}
            className={`py-2.5 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-display uppercase tracking-wide ${
              !isDelivery
                ? "bg-white text-text-strong shadow-xs border border-surface-border"
                : "text-text-muted hover:text-text-strong"
            }`}
          >
            <Store className={`w-4 h-4 ${!isDelivery ? "text-brand-primary" : "text-text-muted"}`} />
            <span>Retiro en Local</span>
            <span className="text-[11px] font-mono text-status-success font-bold">
              (Gratis)
            </span>
          </button>
        </div>
      </div>

      {/* 2. Sección Dinámica según Modalidad */}
      {isDelivery ? (
        /* --- MODO A DOMICILIO --- */
        <div className="space-y-4">
          {/* Direcciones Guardadas para usuarios con cuenta */}
          {isAuthenticated && addresses.length > 0 && (
            <div className="p-3 bg-surface-card sm:bg-surface-canvas rounded-2xl border border-surface-border space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <Bookmark className="w-3.5 h-3.5 text-brand-primary" />
                <span>Usar Dirección Guardada:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-card hover:bg-surface-card-hover border border-surface-border hover:border-brand-primary text-text-strong transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-brand-primary" />
                    <span>{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[9px] font-bold text-text-muted uppercase">(Predeterminada)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ubicación de Entrega en Mapa Directo (Abierto Automáticamente) */}
          <input type="hidden" {...register("addressStreet")} />

          <div className="space-y-3">
            {/* Mapa Interactivo MapLibre abierto directamente */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-strong font-display uppercase tracking-wide">
                  Ubica tu entrega en el mapa:
                </span>
                {isValidatingLocation && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Validando cobertura...</span>
                  </span>
                )}
              </div>

              <AddressSelector
                initialLat={initialMapLat}
                initialLng={initialMapLng}
                onLocationSelect={(lat, lng) => validateCoordinates(lat, lng)}
              />
            </div>

            {/* Dirección Detectada Automáticamente */}
            {watchedAddressStreet && (
              <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border flex items-start gap-2.5 text-xs animate-in fade-in">
                <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block font-display">
                    Dirección Detectada
                  </span>
                  <p className="font-bold text-text-strong text-xs sm:text-sm mt-0.5 truncate">
                    {watchedAddressStreet}
                  </p>
                  {resolvedBranch && (
                    <p className="text-[11px] text-status-success font-semibold mt-0.5">
                      Cobertura confirmada • Sede {resolvedBranch.branchName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error de validación si no se ha fijado un punto */}
            {errors.addressStreet && !watchedAddressStreet && (
              <p className="text-[11px] text-status-danger font-medium">
                {errors.addressStreet.message || "Por favor selecciona tu ubicación en el mapa o detecta tu GPS."}
              </p>
            )}

            {/* Referencia Adicional Única y 100% Opcional */}
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">
                Referencia de Entrega (Opcional)
              </label>
              <input
                {...register("addressReference")}
                placeholder="Ej. Casa de 2 pisos color crema, timbre 3B (opcional)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-surface-card text-text-strong"
              />
            </div>
          </div>

            {/* Estado de Cobertura Confirmado */}
            {resolvedBranch && (
              <div className="bg-status-success-bg border border-status-success-border rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-status-success animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold">
                    {resolvedBranch.isDirectCoverage === false
                      ? `Asignada por cercanía • Sede ${resolvedBranch.branchName}`
                      : `Cobertura confirmada • Despacha Sede ${resolvedBranch.branchName}`}
                    {resolvedBranch.distanceKm ? ` (${resolvedBranch.distanceKm} km)` : ""}
                  </p>
                  <p className="text-status-success/80 text-[11px] mt-0.5 truncate">
                    {resolvedBranch.address}
                  </p>
                  {branchCapacity && (
                    <p className="text-[11px] font-mono font-bold mt-1 text-text-strong">
                      Tiempo estimado de entrega: {branchCapacity.estimatedDeliveryTime}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Alerta de Fuera de Cobertura */}
            {coverageError && (
              <div className="bg-status-warning-bg border border-status-warning-border rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-status-warning animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Fuera de Zona de Cobertura Directa</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{coverageError}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
        /* --- MODO RETIRO EN LOCAL --- */
        <div className="space-y-4 animate-in fade-in duration-200">
          {hasMultipleBranches ? (
            /* Restaurante Multisucursal: el cliente elige en qué sede retira */
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-base">
                Selecciona la sucursal donde retirarás tu pedido:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {branches.map((b) => {
                  const isSelected = b.id === cartBranchId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBranch(b.id, b.name);
                        setValue("addressStreet", `Retiro en mostrador - Sede ${b.name}`);
                        setValue("addressReference", b.address);
                      }}
                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "border-brand-primary bg-surface-card ring-1 ring-brand-primary shadow-xs"
                          : "border-surface-border hover:border-surface-border-subtle bg-surface-canvas/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-text-strong text-xs font-display uppercase">
                          {b.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-primary" />}
                      </div>
                      <p className="text-[11px] text-text-muted leading-tight truncate">
                        {b.address}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-text-muted mt-1">
                        <Clock className="w-3 h-3 text-brand-primary shrink-0" />
                        <span>Horario: {b.openingTime} - {b.closingTime}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Restaurante Monosucursal: se le presenta directamente la sede única sin cuadros anidados */
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-canvas border border-surface-border/60 text-xs">
              <Store className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-bold text-text-strong font-display uppercase">
                    Sede {currentBranch?.name || "Principal"}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    • Horario: {currentBranch?.openingTime || "10:30"} a {currentBranch?.closingTime || "21:30"}
                  </span>
                </div>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  {currentBranch?.address || "Atención directa en mostrador"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Datos de Contacto del Cliente */}
      <div className="pt-2 space-y-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-strong font-display">
            Datos de Contacto
          </h4>
          <p className="text-[11px] text-text-muted">
            Para notificaciones y coordinación de tu comanda
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-base mb-1">
              Nombre Completo *
            </label>
            <input
              {...register("customerName")}
              placeholder="Ej. Carlos Mendoza"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-surface-card text-text-strong"
            />
            {errors.customerName && (
              <p className="text-[11px] text-status-danger mt-1 font-medium">
                {errors.customerName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-text-base mb-1">
              Teléfono Celular *
            </label>
            <input
              {...register("customerPhone")}
              placeholder="Ej. 0987654321"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-surface-card text-text-strong"
            />
            {errors.customerPhone && (
              <p className="text-[11px] text-status-danger mt-1 font-medium">
                {errors.customerPhone.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
