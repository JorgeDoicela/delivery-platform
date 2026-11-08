"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle2, XCircle, Pencil, Loader2 } from "lucide-react";
import { formatCurrency } from "@/shared/lib/utils";
import type { MenuProductDto } from "@/shared/types/api";

interface InventoryDesktopTableProps {
  products: Array<MenuProductDto & { categoryName: string }>;
  togglingId: number | null;
  onToggleStatus: (productId: number, currentStatus: boolean) => void;
  onEditProduct: (product: MenuProductDto) => void;
}

export function InventoryDesktopTable({
  products,
  togglingId,
  onToggleStatus,
  onEditProduct,
}: InventoryDesktopTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface-canvas text-text-muted uppercase font-mono tracking-wider text-[11px] border-b border-surface-border">
          <tr>
            <th className="px-5 py-3.5">Producto</th>
            <th className="px-4 py-3.5">Categoría</th>
            <th className="px-4 py-3.5">Precio</th>
            <th className="px-4 py-3.5">Modificadores</th>
            <th className="px-4 py-3.5">Estado</th>
            <th className="px-5 py-3.5 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {products.map((product) => {
            const isPending = togglingId === product.id;

            return (
              <tr
                key={product.id}
                className="hover:bg-surface-canvas/60 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-surface-canvas shrink-0 border border-surface-border">
                      <Image
                        src={
                          product.imageUrl ||
                          "/images/shared/placeholders/dish-default.webp"
                        }
                        alt={product.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-text-strong text-sm">
                        {product.name}
                      </p>
                      <p className="text-text-muted text-[11px] line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="bg-surface-canvas text-text-muted font-mono text-[10px] px-2 py-0.5 rounded border border-surface-border">
                    {product.categoryName}
                  </span>
                </td>

                <td className="px-4 py-4 font-mono font-bold text-brand-accent">
                  {formatCurrency(product.basePrice)}
                </td>

                <td className="px-4 py-4 text-text-muted text-[11px]">
                  {product.modifierGroups.length > 0 ? (
                    <span>{product.modifierGroups.length} grupos</span>
                  ) : (
                    <span className="text-text-subtle">Ninguno</span>
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
                  <div className="inline-flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEditProduct(product)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-canvas hover:bg-surface-card-hover text-text-strong border border-surface-border transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Editar / Imagen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(product.id, product.isActive)
                      }
                      disabled={isPending}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                        product.isActive
                          ? "bg-status-danger/15 hover:bg-status-danger/25 text-status-danger border border-status-danger/40"
                          : "bg-status-success/15 hover:bg-status-success/25 text-status-success border border-status-success/40"
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
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

