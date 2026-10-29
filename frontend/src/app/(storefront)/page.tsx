import Link from "next/link";
import {
  CatalogHero,
  OrderModeSelector,
  PromotionalBanners,
  CatalogSection,
} from "@/features/catalog";

export const metadata = {
  title: "La Granjita Asadero | Pedidos Directos y Delivery",
  description: "Pollo asado al carbón y combos familiares directos a tu domicilio desde La Granjita Asadero.",
};

export default function StorefrontHomePage() {
  return (
    <div className="w-full pb-12 space-y-12">
      {/* 1. Gran Banner Panorámico Promocional (Estilo Hero KFC a Ancho Completo) */}
      <CatalogHero />

      {/* Contenedor a ancho completo para el resto de secciones */}
      <div className="w-full px-4 sm:px-8 lg:px-12 space-y-12">
        {/* 2. Selector Principal: ¿Cómo te gustaría ordenar hoy? (Estilo Bloques Rojos KFC) */}
        <OrderModeSelector />

        {/* 3. Tarjetas Promocionales de Especialidad y Receta (Estilo Tarjetas Inferiores KFC) */}
        <PromotionalBanners />

        {/* 4. Menú y Combos Interactivo en Vivo */}
        <section id="catalogo" className="max-w-[1240px] mx-auto space-y-6 pt-6 w-full">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide">
                Menú y Combos
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal
              </p>
            </div>
          </div>

          <CatalogSection />

          {/* 5. Panel de Accesos Directos a Rutas del Sistema */}
          <div className="pt-8 border-t border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-text-strong uppercase tracking-wide font-display">
                  Accesos Directos del Sistema
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Navegación rápida a todas las pantallas y módulos operativos de la plataforma
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Grupo Tienda */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Tienda & Clientes
                </span>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/catalogo"
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                  >
                    <span>Catálogo Completo</span>
                    <span className="text-[10px] text-neutral-400 font-mono">/catalogo</span>
                  </Link>

                  <Link
                    href="/sucursales"
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                  >
                    <span>Sucursales & Horarios</span>
                    <span className="text-[10px] text-neutral-400 font-mono">/sucursales</span>
                  </Link>

                  <Link
                    href="/finalizar-pedido"
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                  >
                    <span>Finalizar Pedido / Checkout</span>
                    <span className="text-[10px] text-neutral-400 font-mono">/finalizar-pedido</span>
                  </Link>

                  <Link
                    href="/rastreo"
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                  >
                    <span>Rastreo Satelital</span>
                    <span className="text-[10px] text-neutral-400 font-mono">/rastreo</span>
                  </Link>
                </div>
              </div>

              {/* Grupo Operaciones & KDS */}
              <div className="bg-neutral-950 text-white rounded-3xl p-5 space-y-3 shadow-md border border-neutral-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Cocina & Administración
                </span>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/cocina"
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-800 hover:border-brand-primary hover:bg-neutral-900 text-xs font-black uppercase tracking-wider font-display transition-colors text-white"
                  >
                    <span>Terminal Cocina (KDS)</span>
                    <span className="text-[10px] text-neutral-400 font-mono">/cocina</span>
                  </Link>

                  <Link
                    href="/admin/inventario"
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-800 hover:border-brand-primary hover:bg-neutral-900 text-xs font-black uppercase tracking-wider font-display transition-colors text-white"
                  >
                    <span>Control de Inventario</span>
                    <span className="text-[10px] text-neutral-400 font-mono">/admin/inventario</span>
                  </Link>

                  <Link
                    href="/admin/sucursales"
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-800 hover:border-brand-primary hover:bg-neutral-900 text-xs font-black uppercase tracking-wider font-display transition-colors text-white"
                  >
                    <span>Capacidad de Hornos</span>
                    <span className="text-[10px] text-neutral-400 font-mono">/admin/sucursales</span>
                  </Link>
                </div>
              </div>

              {/* Grupo Repartidor & Telemetría */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Repartidor en Ruta
                  </span>
                  <div className="flex flex-col gap-2 mt-3">
                    <Link
                      href="/repartidor"
                      className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                    >
                      <span>App Móvil de Repartidor</span>
                      <span className="text-[10px] text-neutral-400 font-mono">/repartidor</span>
                    </Link>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-[11px] text-neutral-500 space-y-1">
                  <p className="font-bold text-neutral-700">Ruta dinámica en vivo:</p>
                  <p className="font-mono text-[10px] text-neutral-600">/rastreo/[orderId]</p>
                  <p className="text-[10px] text-neutral-400 leading-tight">
                    Se abre automáticamente tras confirmar un pedido en el checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
