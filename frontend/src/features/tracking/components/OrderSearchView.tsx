"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight } from "lucide-react";

export function OrderSearchView() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderId.trim();
    if (!cleanId) {
      setError("Por favor ingresa el número o código de tu orden.");
      return;
    }
    router.push(`/track/${cleanId}`);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-orange-600/10 text-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Rastrear tu Pedido
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Ingresa el código identificador de tu pedido (recibido al confirmar tu compra) para consultar la ubicación del repartidor en vivo.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Código de Pedido (UUID)
          </label>
          <div className="relative">
            <input
              type="text"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              className="w-full text-xs pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          </div>
          {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md shadow-orange-600/20 transition-all active:scale-95"
        >
          <span>Consultar Estado</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

