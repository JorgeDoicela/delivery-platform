import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { BranchManagementView } from "@/features/branches";

export const metadata = {
  title: "Sucursales y Cobertura | La Granjita Asadero",
  description: "Monitoreo de geocercas poligonales PostGIS y límites por ranura en Redis para La Granjita Asadero.",
};

export default function AdminSucursalesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-inverse-muted">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
          <p className="text-sm font-medium">Cargando sucursales y geocercas...</p>
        </div>
      }
    >
      <BranchManagementView />
    </Suspense>
  );
}

