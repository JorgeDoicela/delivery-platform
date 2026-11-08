"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { useMenuQuery } from "../hooks/useMenuQuery";
import { apiClient } from "@/shared/lib/api-client";
import { formatCurrency } from "@/shared/lib/utils";
import type { MenuProductDto } from "@/shared/types/api";
import { ProductFormModal } from "./ProductFormModal";
import { InventoryDesktopTable } from "./InventoryDesktopTable";
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Pencil,
  Loader2,
} from "lucide-react";

export function InventoryManagerView() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useMenuQuery(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuProductDto | null>(
    null
  );

  const handleToggleStatus = async (productId: number, currentStatus: boolean) => {
    setTogglingId(productId);
    setActionMessage(null);

    try {
      const updated = await apiClient.toggleProductStatus(productId, !currentStatus);
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
        <p className="text-sm font-medium">Cargando inventario maestro de productos...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-status-danger/20 border border-status-danger/40 rounded-2xl text-center shadow-lg">
        <AlertTriangle className="h-10 w-10 text-status-danger mx-auto mb-3" />
        <h2 className="text-lg font-bold text-text-strong mb-2">Error de Sincronización</h2>
        <p className="text-sm text-text-muted mb-6">
          No se pudo consultar el catálogo operativo desde el backend.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs rounded-xl font-semibold transition-colors cursor-pointer"
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
    <div className="space-y-6 w-full">
      {/* Cabecera Operativa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-strong font-display">
              Control de Inventario y Disponibilidad
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Conmutador de stock en tiempo real. Los cambios se sincronizan al KDS y al catálogo cliente al instante.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface-card border border-surface-border px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span className="text-text-strong">{activeCount} Disponibles</span>
          </div>
          <div className="bg-surface-card border border-surface-border px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-status-danger" />
            <span className="text-text-strong">{inactiveCount} Agotados</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Alerta de Acción */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
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
      <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-full px-5 py-3 shadow-xs">
        <Search className="w-4 h-4 text-text-muted shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto por nombre o categoría..."
          className="bg-transparent text-xs text-text-strong placeholder:text-text-muted flex-1 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-strong transition-colors cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Vista Responsive: Tarjetas en Móvil (md:hidden) y Tabla en Desktop (hidden md:block) */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-xs">
        {/* Mobile Cards */}
        <div className="divide-y divide-surface-border md:hidden">
          {filteredProducts.map((product) => {
            const isPending = togglingId === product.id;

            return (
              <div key={product.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-canvas shrink-0 border border-surface-border">
                    <Image
                      src={product.imageUrl || "/images/shared/placeholders/dish-default.webp"}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-text-strong text-sm leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <span className="font-mono font-bold text-brand-accent text-sm whitespace-nowrap">
                        {formatCurrency(product.basePrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-surface-canvas text-text-muted font-mono text-[10px] px-2 py-0.5 rounded border border-surface-border truncate">
                        {product.categoryName}
                      </span>
                      {product.modifierGroups.length > 0 && (
                        <span className="text-text-muted text-[10px]">
                          {product.modifierGroups.length} modif.
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          product.isActive
                            ? "bg-status-success/20 text-status-success border border-status-success/40"
                            : "bg-status-danger/20 text-status-danger border border-status-danger/40"
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>En Menú</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Agotado</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones móviles con botones de al menos 42px para pulsación táctil ergonómica */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-surface-canvas hover:bg-surface-card-hover text-text-strong border border-surface-border transition-colors cursor-pointer min-h-[42px]"
                  >
                    <Pencil className="w-3.5 h-3.5 text-brand-accent" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(product.id, product.isActive)}
                    disabled={isPending}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 cursor-pointer min-h-[42px] ${
                      product.isActive
                        ? "bg-status-danger/15 hover:bg-status-danger/25 text-status-danger border border-status-danger/40"
                        : "bg-status-success/15 hover:bg-status-success/25 text-status-success border border-status-success/40"
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : product.isActive ? (
                      <span>Pausar</span>
                    ) : (
                      <span>Habilitar</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table Modularizada */}
        <InventoryDesktopTable
          products={filteredProducts}
          togglingId={togglingId}
          onToggleStatus={handleToggleStatus}
          onEditProduct={(p) => {
            setEditingProduct(p);
            setIsProductModalOpen(true);
          }}
        />
      </div>

      <ProductFormModal
        key={editingProduct ? `edit-${editingProduct.id}` : `new-${ isProductModalOpen ? "open" : "closed"}`}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
        existingCategories={data.categories.map((c) => c.categoryName)}
        onSaved={async (msg) => {
          await queryClient.invalidateQueries({ queryKey: ["catalog", "menu"] });
          setActionMessage({ text: msg, type: "success" });
        }}
      />
    </div>
  );
}
