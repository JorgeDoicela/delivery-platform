import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { BranchManagementView } from "@/features/branches";

export const metadata = {
  title: "Sucursales y Cobertura | Delivery Platform",
  description: "Monitoreo de geocercas poligonales PostGIS y límites por ranura en Redis.",
};

export default function AdminBranchesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mb-4" />
          <p className="text-sm font-medium">Cargando sucursales y geocercas...</p>
        </div>
      }
    >
      <BranchManagementView />
    </Suspense>
  );
}
