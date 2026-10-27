import Link from "next/link";
import { ArrowRight, Flame, Clock, ShieldCheck, MapPin } from "lucide-react";
import { CatalogSection } from "@/features/catalog/components/CatalogSection";

export default function StorefrontHomePage() {
  return (
    <div className="space-y-12">
      {/* Banner Principal / Hero Comercial */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white p-8 md:p-14 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-orange-600/30 text-orange-400 border border-orange-500/40 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            Pollo Asado al Carbón & Leña
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Directo de nuestro asador hasta tu mesa.
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Sin intermediarios ni recargos ocultos. Disfruta combos familiares completos con guarniciones calientes, ensalada fresca y ají artesanal.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="#catalogo"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-orange-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Ver Menú y Combos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-3.5 rounded-xl border border-white/20 transition-all backdrop-blur-sm"
            >
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>Verificar Cobertura</span>
            </Link>
          </div>
        </div>

        {/* Pilares Operativos */}
        <div className="mt-10 pt-8 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Despacho Rápido</p>
              <p className="text-slate-400">Control por franjas de 20 min</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">2 Sucursales</p>
              <p className="text-slate-400">Norte y Sur de la ciudad</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Factura SRI</p>
              <p className="text-slate-400">Emisión electrónica segura</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección del Menú Interactivo en Vivo */}
      <section id="catalogo" className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Menú y Combos
            </h2>
            <p className="text-xs text-slate-500">
              Personaliza tu orden con guarniciones y salsas artesanales
            </p>
          </div>
        </div>

        <CatalogSection />
      </section>
    </div>
  );
}
