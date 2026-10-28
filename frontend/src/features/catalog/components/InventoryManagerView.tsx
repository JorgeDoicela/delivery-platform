"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMenuQuery } from "../hooks/useMenuQuery";
import { apiClient } from "@/shared/lib/api-client";
import { formatCurrency } from "@/shared/lib/utils";
import {
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";

export function InventoryManagerView() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useMenuQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleToggleStatus = async (productId: number, currentStatus: boolean) => {
    setTogglingId(productId);
    setActionMessage(null);

    try {
      const updated = await apiClient.toggleProductStatus(productId, !currentStatus);
      // Actualizar caché de react-query para reflejar el cambio inmediatamente
      await queryClient.invalidateQueries({ queryKey: ["catalog", "menu"] });
      setActionMessage({
        text: `Producto "${updated.productName}" ${
          updated.isActive ? "activado para ventas" : "marcado como agotado"
        }.`,
        type: "success",
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al actualizar la disponibilidad del producto.";
      setActionMessage({ text: msg, type: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mb-4" />
        <p className="text-sm font-medium">Cargando inventario maestro de productos...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-950/20 border border-red-800 rounded-2xl text-center shadow-lg">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Error de Sincronización</h2>
        <p className="text-sm text-neutral-400 mb-6">
          No se pudo consultar el catálogo operativo desde el backend.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-xl font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  const allProducts = data.categories.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, categoryName: cat.categoryName }))
  );

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = allProducts.filter((p) => p.isActive).length;
  const inactiveCount = allProducts.length - activeCount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabecera Operativa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <h1 className="text-xl font-black text-white tracking-tight">
              Control de Inventario y Disponibilidad
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conmutador de stock en tiempo real. Los cambios se sincronizan al KDS y al catálogo cliente al instante.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-medium">{activeCount} Disponibles</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-300 font-medium">{inactiveCount} Agotados</span>
          </div>
        </div>
      </div>

      {/* Alerta de Acción */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            actionMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Barra de Filtro y Búsqueda */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto por nombre o categoría..."
          className="bg-transparent text-xs text-white placeholder-slate-500 flex-1 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-white"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla de Productos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5">Modificadores</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((product) => {
                const isPending = togglingId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-white text-sm">{product.name}</p>
                      <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                        {product.categoryName}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-orange-400">
                      {formatCurrency(product.basePrice)}
                    </td>

                    <td className="px-4 py-4 text-slate-400 text-[11px]">
                      {product.modifierGroups.length > 0 ? (
                        <span>{product.modifierGroups.length} grupos</span>
                      ) : (
                        <span className="text-slate-500">Ninguno</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          product.isActive
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/80"
                            : "bg-red-950 text-red-400 border border-red-800/80"
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>En Menú</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Agotado</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product.id, product.isActive)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                          product.isActive
                            ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30"
                            : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Actualizando...</span>
                          </>
                        ) : product.isActive ? (
                          <span>Pausar Venta</span>
                        ) : (
                          <span>Habilitar</span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

