import Link from "next/link";
import Image from "next/image";
import { Utensils, Volume2, Package, Building2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-dark text-text-inverse-strong">
      {/* Barra de Estado KDS y Operaciones con Identidad La Granjita */}
      <header className="h-16 bg-surface-dark-card border-b border-surface-dark-border px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/cocina" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 shrink-0">
              <Image
                src="/images/identidad/logo.png"
                alt="Logo La Granjita"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span
                data-display-brand
                className="font-black text-xl tracking-tight text-white block leading-none uppercase font-display"
              >
                LA GRANJITA
              </span>
              <span className="text-[10px] tracking-widest text-brand-accent font-bold uppercase block mt-0.5">
                Operaciones & Cocina
              </span>
            </div>
          </Link>

          {/* Navegación Modular de Operaciones */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Link
              href="/cocina"
              className="px-3.5 py-1.5 rounded-full text-text-inverse-muted hover:text-white hover:bg-surface-dark-hover transition-colors flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5 text-brand-primary" />
              <span>Cocina KDS</span>
            </Link>

            <Link
              href="/admin/inventario"
              className="px-3.5 py-1.5 rounded-full text-text-inverse-muted hover:text-white hover:bg-surface-dark-hover transition-colors flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-brand-accent" />
              <span>Inventario</span>
            </Link>

            <Link
              href="/admin/sucursales"
              className="px-3.5 py-1.5 rounded-full text-text-inverse-muted hover:text-white hover:bg-surface-dark-hover transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-status-info" />
              <span>Sucursales</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="hidden lg:inline-block text-[10px] bg-surface-dark-hover text-text-inverse-muted px-3 py-1 rounded-full font-mono uppercase tracking-wider border border-surface-dark-border">
            Sucursal #1 (Norte)
          </span>

          <div className="flex items-center gap-2 bg-surface-dark-hover/80 px-3 py-1 rounded-full border border-surface-dark-border text-[11px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-status-success animate-ping"></span>
            <span className="text-status-success hidden sm:inline">SignalR Activo</span>
          </div>

          <div className="flex items-center gap-1.5 text-text-inverse-muted bg-surface-dark-hover px-3 py-1 rounded-full border border-surface-dark-border text-[11px] font-bold uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5 text-brand-accent" />
            <span className="hidden sm:inline">Alarma</span>
          </div>

          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-wider text-text-inverse-muted hover:text-white transition-colors px-3 py-1.5 rounded-full bg-surface-dark-hover hover:bg-surface-dark-hover/80 border border-surface-dark-border"
          >
            <span>Ver Tienda</span>
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
