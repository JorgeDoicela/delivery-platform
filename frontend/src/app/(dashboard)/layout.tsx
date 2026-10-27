import Link from "next/link";
import { Utensils, Volume2, ShieldCheck } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Barra de Estado KDS y Operaciones */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/kitchen" className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span>KDS Cocina</span>
          </Link>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono border border-slate-700">
            Sucursal #1 (Norte)
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-medium">SignalR Conectado</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Volume2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Alarma Activa</span>
          </div>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ver Tienda</span>
          </Link>
        </div>
      </header>

      {/* Contenedor del Tablero Kanban */}
      <main className="flex-1 p-4 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
