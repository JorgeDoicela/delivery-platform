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
    router.push(`/rastreo/${cleanId}`);
  };

  return (
    <div className="w-full py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-brand-primary text-white rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md shadow-brand-primary/25">
          <MapPin className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
          Rastrear tu Pedido
        </h1>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
          Ingresa el código identificador de tu pedido para consultar la ubicación satelital del repartidor y el estado en horno en vivo.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="bg-surface-card p-6 sm:p-8 rounded-3xl border border-surface-border shadow-sm space-y-5 w-full"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-base mb-2">
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
              className="w-full text-xs pl-5 pr-12 py-3.5 rounded-full border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono"
            />
            <Search className="w-4 h-4 text-text-subtle absolute right-4 top-4" />
          </div>
          {error && <p className="text-xs text-status-danger mt-1.5 font-medium">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-text-inverse-strong font-black text-xs uppercase tracking-wider py-4 px-6 rounded-full shadow-xl shadow-brand-primary/25 transition-all hover:scale-[1.01] active:scale-95"
        >
          <span>Consultar Estado</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

