import Link from "next/link";
import { Utensils, Volume2, ShieldCheck, Package, Building2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-dark text-text-inverse-strong">
      {/* Barra de Estado KDS y Operaciones */}
      <header className="h-14 bg-surface-dark-card border-b border-surface-dark-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/kitchen" className="flex items-center gap-2 font-bold text-base text-white">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span>Delivery Ops</span>
          </Link>

          {/* Navegación Modular de Operaciones */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <Link
              href="/kitchen"
              className="px-3 py-1.5 rounded-lg text-text-inverse-muted hover:text-white hover:bg-surface-dark-hover transition-colors font-medium flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5 text-brand-primary" />
              <span>Cocina KDS</span>
            </Link>

            <Link
              href="/admin/inventory"
              className="px-3 py-1.5 rounded-lg text-text-inverse-muted hover:text-white hover:bg-surface-dark-hover transition-colors font-medium flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-brand-accent" />
              <span>Inventario</span>
            </Link>

            <Link
              href="/admin/branches"
              className="px-3 py-1.5 rounded-lg text-text-inverse-muted hover:text-white hover:bg-surface-dark-hover transition-colors font-medium flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-status-info" />
              <span>Sucursales</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="hidden lg:inline-block text-[11px] bg-surface-dark-hover text-text-inverse-muted px-2.5 py-1 rounded-md font-mono border border-surface-dark-border">
            Sucursal #1 (Norte)
          </span>

          <div className="flex items-center gap-2 bg-surface-dark-hover/80 px-2.5 py-1 rounded-lg border border-surface-dark-border">
            <span className="w-2 h-2 rounded-full bg-status-success animate-ping"></span>
            <span className="text-status-success font-medium hidden sm:inline">SignalR Activo</span>
          </div>

          <div className="flex items-center gap-1.5 text-text-inverse-muted bg-surface-dark-hover px-2.5 py-1 rounded-lg border border-surface-dark-border">
            <Volume2 className="w-3.5 h-3.5 text-brand-accent" />
            <span className="hidden sm:inline">Alarma</span>
          </div>

          <Link
            href="/"
            className="text-xs text-text-inverse-muted hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-surface-dark-hover"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ver Tienda</span>
          </Link>
        </div>
      </header>

      {/* Contenedor Operativo */}
      <main className="flex-1 p-4 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
