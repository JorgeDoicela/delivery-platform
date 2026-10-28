import { Navigation, Radio } from "lucide-react";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-dark text-text-inverse-strong select-none">
      {/* Top Header Ergonómico */}
      <header className="h-14 bg-surface-dark-card border-b border-surface-dark-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-status-success flex items-center justify-center">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Repartidor</h1>
            <span className="text-[10px] text-text-inverse-muted">ID: driver-01</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-status-success-bg text-status-success border border-status-success-border px-2.5 py-1 rounded-full text-xs font-medium">
          <Radio className="w-3 h-3 animate-pulse text-status-success" />
          <span>GPS Activo</span>
        </div>
      </header>

      {/* Contenido Táctil */}
      <main className="flex-1 p-4 flex flex-col max-w-md mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
