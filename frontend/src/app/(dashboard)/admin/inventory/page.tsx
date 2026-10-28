import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { InventoryManagerView } from "@/features/catalog";

export const metadata = {
  title: "Control de Inventario | Delivery Platform",
  description: "Conmutador de disponibilidad inmediata de productos y combos.",
};

export default function AdminInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-inverse-muted">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
          <p className="text-sm font-medium">Cargando inventario maestro...</p>
        </div>
      }
    >
      <InventoryManagerView />
    </Suspense>
  );
}
