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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-inverse-muted">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
        <p className="text-sm font-medium">Cargando inventario maestro de productos...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-status-danger/20 border border-status-danger/40 rounded-2xl text-center shadow-lg">
        <AlertTriangle className="h-10 w-10 text-status-danger mx-auto mb-3" />
        <h2 className="text-lg font-bold text-text-inverse-strong mb-2">Error de Sincronización</h2>
        <p className="text-sm text-text-inverse-muted mb-6">
          No se pudo consultar el catálogo operativo desde el backend.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-dark-card hover:bg-surface-dark-hover text-text-inverse-strong text-xs rounded-xl font-semibold transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-dark-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-primary" />
            <h1 className="text-xl font-black text-text-inverse-strong tracking-tight">
              Control de Inventario y Disponibilidad
            </h1>
          </div>
          <p className="text-xs text-text-inverse-muted mt-1">
            Conmutador de stock en tiempo real. Los cambios se sincronizan al KDS y al catálogo cliente al instante.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-dark-card border border-surface-dark-border px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span className="text-text-inverse-base font-medium">{activeCount} Disponibles</span>
          </div>
          <div className="bg-surface-dark-card border border-surface-dark-border px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-danger" />
            <span className="text-text-inverse-base font-medium">{inactiveCount} Agotados</span>
          </div>
        </div>
      </div>

      {/* Alerta de Acción */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            actionMessage.type === "success"
              ? "bg-status-success/20 border-status-success/40 text-status-success"
              : "bg-status-danger/20 border-status-danger/40 text-status-danger"
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
      <div className="flex items-center gap-3 bg-surface-dark-card border border-surface-dark-border rounded-xl px-3.5 py-2">
        <Search className="w-4 h-4 text-text-inverse-muted shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto por nombre o categoría..."
          className="bg-transparent text-xs text-text-inverse-strong placeholder-text-inverse-subtle flex-1 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-text-inverse-muted hover:text-text-inverse-strong"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla de Productos */}
      <div className="bg-surface-dark-card border border-surface-dark-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-dark text-text-inverse-muted uppercase font-mono tracking-wider border-b border-surface-dark-border">
              <tr>
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5">Modificadores</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark-border/60">
              {filteredProducts.map((product) => {
                const isPending = togglingId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-surface-dark-hover/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-text-inverse-strong text-sm">{product.name}</p>
                      <p className="text-text-inverse-muted text-[11px] line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="bg-surface-dark-hover text-text-inverse-base font-mono text-[10px] px-2 py-0.5 rounded border border-surface-dark-border">
                        {product.categoryName}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-brand-accent">
                      {formatCurrency(product.basePrice)}
                    </td>

                    <td className="px-4 py-4 text-text-inverse-muted text-[11px]">
                      {product.modifierGroups.length > 0 ? (
                        <span>{product.modifierGroups.length} grupos</span>
                      ) : (
                        <span className="text-text-inverse-subtle">Ninguno</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          product.isActive
                            ? "bg-status-success/20 text-status-success border border-status-success/40"
                            : "bg-status-danger/20 text-status-danger border border-status-danger/40"
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
                            ? "bg-status-danger/20 hover:bg-status-danger/30 text-status-danger border border-status-danger/40"
                            : "bg-status-success/20 hover:bg-status-success/30 text-status-success border border-status-success/40"
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

