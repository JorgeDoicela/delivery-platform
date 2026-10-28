import Link from "next/link";
import { ArrowRight, Flame, Clock, ShieldCheck, MapPin } from "lucide-react";

export function CatalogHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-dark via-surface-dark-card to-surface-dark text-white p-8 md:p-14 shadow-xl border border-surface-dark-border">
      <div className="relative z-10 max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 bg-brand-primary-muted text-brand-accent border border-brand-accent/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
          <Flame className="w-4 h-4 text-brand-accent animate-pulse" />
          Pollo Asado al Carbón & Leña
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
          Directo de nuestro asador hasta tu mesa.
        </h1>

        <p className="text-text-inverse-muted text-sm md:text-base leading-relaxed">
          Sin intermediarios ni recargos ocultos. Disfruta combos familiares completos con guarniciones calientes, ensalada fresca y ají artesanal.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="#catalogo"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-brand-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Ver Menú y Combos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-3.5 rounded-xl border border-white/20 transition-all backdrop-blur-sm"
          >
            <MapPin className="w-4 h-4 text-brand-accent" />
            <span>Verificar Cobertura</span>
          </Link>
        </div>
      </div>

      {/* Pilares Operativos */}
      <div className="mt-10 pt-8 border-t border-surface-dark-border grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-text-inverse-muted">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-primary-muted text-brand-primary flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white">Despacho Rápido</p>
            <p className="text-text-inverse-subtle">Control por franjas de 20 min</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-status-success-bg text-status-success flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white">2 Sucursales</p>
            <p className="text-text-inverse-subtle">Norte y Sur de la ciudad</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-status-info-bg text-status-info flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white">Factura SRI</p>
            <p className="text-text-inverse-subtle">Emisión electrónica segura</p>
          </div>
        </div>
      </div>
    </section>
  );
}

