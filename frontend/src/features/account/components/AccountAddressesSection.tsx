"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  AlertCircle,
  X,
  Star,
} from "lucide-react";
import { addressSchema, type AddressFormData } from "../schemas/accountSchemas";
import { useAccountStore } from "../store/useAccountStore";
import type { AccountAddress } from "../types";

export function AccountAddressesSection() {
  const addresses = useAccountStore((s) => s.addresses);
  const isLoadingAddresses = useAccountStore((s) => s.isLoadingAddresses);
  const isSaving = useAccountStore((s) => s.isSaving);
  const addressesError = useAccountStore((s) => s.addressesError);
  const actionSuccessMessage = useAccountStore((s) => s.actionSuccessMessage);
  const fetchAddresses = useAccountStore((s) => s.fetchAddresses);
  const saveAddress = useAccountStore((s) => s.saveAddress);
  const deleteAddress = useAccountStore((s) => s.deleteAddress);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AccountAddress | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      street: "",
      secondaryStreet: "",
      reference: "",
      buildingNumber: "",
      latitude: -0.1807, // Centro predeterminado Quito
      longitude: -78.4678,
      isDefault: false,
    },
  });

  const handleOpenCreate = () => {
    setSelectedAddress(null);
    reset({
      label: "",
      street: "",
      secondaryStreet: "",
      reference: "",
      buildingNumber: "",
      latitude: -0.1807,
      longitude: -78.4678,
      isDefault: addresses.length === 0,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (addr: AccountAddress) => {
    setSelectedAddress(addr);
    reset({
      id: addr.id,
      label: addr.label,
      street: addr.street,
      secondaryStreet: addr.secondaryStreet || "",
      reference: addr.reference || "",
      buildingNumber: addr.buildingNumber || "",
      latitude: addr.latitude,
      longitude: addr.longitude,
      isDefault: addr.isDefault,
    });
    setIsEditing(true);
  };

  const onSubmit = async (data: AddressFormData) => {
    const success = await saveAddress({
      id: selectedAddress ? selectedAddress.id : null,
      label: data.label,
      street: data.street,
      secondaryStreet: data.secondaryStreet || null,
      reference: data.reference || null,
      buildingNumber: data.buildingNumber || null,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.isDefault,
    });

    if (success) {
      setIsEditing(false);
      setSelectedAddress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta dirección guardada?")) {
      await deleteAddress(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y botón de nueva dirección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-3xl p-6 md:p-8">
        <div>
          <h2 className="text-lg font-black text-neutral-900 font-display uppercase tracking-tight">
            Libreta de Direcciones
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Guarda tus ubicaciones frecuentes para pedir en un solo clic.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-sm min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Dirección</span>
          </button>
        )}
      </div>

      {actionSuccessMessage && (
        <div className="flex items-start gap-3 p-4 bg-neutral-900 text-white rounded-2xl text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="font-medium">{actionSuccessMessage}</p>
        </div>
      )}

      {addressesError && (
        <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-2xl text-xs">
          <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <p className="font-medium">{addressesError}</p>
        </div>
      )}

      {/* Formulario de Alta / Edición */}
      {isEditing && (
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <h3 className="text-sm font-black text-neutral-900 font-display uppercase tracking-tight">
              {selectedAddress ? "Editar Ubicación" : "Nueva Ubicación de Entrega"}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Etiqueta (Ej: Casa, Oficina, Depto) *
                </label>
                <input
                  type="text"
                  {...register("label")}
                  placeholder="Mi Casa"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900"
                />
                {errors.label && (
                  <p className="text-xs text-brand-primary">{errors.label.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Calle Principal *
                </label>
                <input
                  type="text"
                  {...register("street")}
                  placeholder="Av. Amazonas"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900"
                />
                {errors.street && (
                  <p className="text-xs text-brand-primary">{errors.street.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Calle Secundaria / Intersección
                </label>
                <input
                  type="text"
                  {...register("secondaryStreet")}
                  placeholder="y Naciones Unidas"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Número de Edificio / Casa
                </label>
                <input
                  type="text"
                  {...register("buildingNumber")}
                  placeholder="N34-120"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Referencia de Entrega (Piso, Puerta, Color del inmueble)
              </label>
              <textarea
                {...register("reference")}
                rows={2}
                placeholder="Torre B, Piso 4, Departamento 402. Tocar timbre 'Mendoza'."
                className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="default-address-cb"
                {...register("isDefault")}
                className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="default-address-cb"
                className="text-xs font-bold text-neutral-800 cursor-pointer"
              >
                Establecer como dirección de entrega predeterminada
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-full text-xs font-bold uppercase text-neutral-600 hover:bg-neutral-100 min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider font-display px-8 py-3 rounded-full min-h-[44px] inline-flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Dirección</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Direcciones */}
      {isLoadingAddresses ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-3 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
          <p className="text-xs text-neutral-500 font-bold uppercase">
            Cargando tus direcciones...
          </p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-10 text-center space-y-3">
          <MapPin className="w-8 h-8 text-neutral-300 mx-auto" />
          <h4 className="text-sm font-black text-neutral-900 font-display uppercase tracking-tight">
            No tienes direcciones guardadas
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Agrega tu domicilio habitual o lugar de trabajo para seleccionarlo al realizar tus pedidos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white border rounded-3xl p-6 space-y-4 transition-colors relative ${
                addr.isDefault
                  ? "border-neutral-900 shadow-xs"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-neutral-900 font-display uppercase tracking-tight">
                      {addr.label}
                    </h4>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-neutral-900">
                        <Star className="w-3 h-3 fill-neutral-900 text-neutral-900" />
                        Predeterminada
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    title="Editar dirección"
                    className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    title="Eliminar dirección"
                    className="p-2 text-neutral-400 hover:text-brand-primary rounded-full hover:bg-neutral-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-neutral-600 space-y-1">
                <p className="font-semibold text-neutral-900">
                  {addr.street} {addr.buildingNumber && `#${addr.buildingNumber}`}
                </p>
                {addr.secondaryStreet && (
                  <p className="text-neutral-500">Intersección: {addr.secondaryStreet}</p>
                )}
                {addr.reference && (
                  <p className="text-neutral-500 italic">Ref: {addr.reference}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

