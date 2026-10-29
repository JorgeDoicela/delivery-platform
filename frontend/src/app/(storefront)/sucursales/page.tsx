import { MapPin, Phone, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Sucursales | La Granjita Asadero",
  description: "Locales operativos, cobertura de entrega y horarios de atención de La Granjita Asadero en Quito.",
};

export default function SucursalesPage() {
  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
          Nuestras Sucursales
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
          Puntos de atención y cobertura de delivery en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                Sucursal #1
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display mt-2">
                La Granjita Norte
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Sector Financiero & La Carolina</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-status-success bg-status-success/15 border border-status-success/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Abierto
            </span>
          </div>

          <div className="space-y-3 text-xs text-text-base bg-surface-canvas border border-surface-border rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <span>Av. Amazonas N34-120 y República (Edif. Sky)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <span className="font-mono">0987654321</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Lunes a Domingo: 10:00 - 22:00</span>
            </div>
          </div>

          <Link
            href="/finalizar-pedido"
            className="inline-flex items-center justify-center w-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95"
          >
            Ordenar en esta sucursal
          </Link>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                Sucursal #2
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display mt-2">
                La Granjita Sur
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Sector Villa Flora & Centro Sur</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-status-success bg-status-success/15 border border-status-success/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Abierto
            </span>
          </div>

          <div className="space-y-3 text-xs text-text-base bg-surface-canvas border border-surface-border rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <span>Av. Rodrigo de Chávez y Maldonado</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <span className="font-mono">0987654322</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Lunes a Domingo: 10:00 - 22:00</span>
            </div>
          </div>

          <Link
            href="/finalizar-pedido"
            className="inline-flex items-center justify-center w-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95"
          >
            Ordenar en esta sucursal
          </Link>
        </div>
      </div>
    </div>
  );
}

