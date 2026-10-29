import Link from "next/link";
import Image from "next/image";
import { MapPin, Search } from "lucide-react";
import { CartButtonBadge } from "@/features/cart";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas">
      {/* Header Comercial Blanco Limpio estilo KFC con Identidad La Granjita */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo Oficial La Granjita */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src="/images/identidad/logo.png"
                alt="Logo La Granjita"
                width={40}
                height={40}
                priority
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span
                data-display-brand
                className="font-black text-2xl tracking-tight text-brand-primary block leading-none uppercase font-display"
              >
                LA GRANJITA
              </span>
              <span className="text-[10px] tracking-widest text-text-muted font-bold uppercase block mt-0.5">
                Asadero
              </span>
            </div>
          </Link>

          {/* Enlaces de Navegación estilo KFC */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-neutral-800">
            <Link href="/catalogo" className="hover:text-brand-primary transition-colors">
              Ordenar
            </Link>
            <Link href="/rastreo" className="hover:text-brand-primary transition-colors">
              Rastrear Pedido
            </Link>
            <Link href="/sucursales" className="hover:text-brand-primary transition-colors text-neutral-600">
              Sucursales
            </Link>
          </nav>

          {/* Selector Rápido de Cobertura / Buscador Píldora */}
          <div className="flex-1 max-w-sm hidden md:flex items-center">
            <Link
              href="/catalogo"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-500 bg-neutral-100 hover:bg-neutral-200/70 rounded-full transition-colors border border-neutral-200/60"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span className="truncate">Buscar productos o combos...</span>
              <MapPin className="w-3.5 h-3.5 text-brand-primary ml-auto shrink-0" />
            </Link>
          </div>

          {/* Acciones: Carrito */}
          <div className="flex items-center gap-3">
            <CartButtonBadge />
          </div>
        </div>
      </header>

      {/* Contenido Principal a Ancho Completo */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer Estilo KFC Limpio con Accesos Operativos */}
      <footer id="sucursales" className="bg-neutral-100 text-neutral-600 text-xs border-t border-neutral-200 mt-16 py-12">
        <div className="w-full px-4 sm:px-8 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src="/images/identidad/logo.png"
                  alt="Logo La Granjita"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-brand-primary text-base uppercase tracking-tight font-display">LA GRANJITA ASADERO</span>
            </div>
            <p className="text-neutral-500 leading-relaxed">
              Pollo asado artesanalmente al carbón vegetal y leña seleccionada en La Granjita Asadero. Pedidos directos sin intermediarios.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
              Sucursales Operativas
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary mt-0.5 shrink-0" />
                <span>La Granjita Norte: Av. Amazonas y República</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary mt-0.5 shrink-0" />
                <span>La Granjita Sur: Av. Rodrigo de Chávez y Maldonado</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
              Garantía y Facturación
            </h4>
            <p className="text-neutral-500 leading-relaxed mb-2">
              Facturación electrónica autorizada SRI. Despacho y entrega monitoreados en tiempo real.
            </p>
            <span className="text-[11px] text-neutral-400">© 2026 La Granjita Asadero. Todos los derechos reservados.</span>
          </div>

          {/* Accesos Operativos Reubicados (Horno y KDS) */}
          <div>
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
              Accesos Operativos
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0"></span>
                <span className="text-[11px] font-medium leading-tight">Horno encendido: Tomando pedidos</span>
              </div>
              <Link
                href="/cocina"
                className="inline-flex items-center justify-center w-full text-xs font-bold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-full transition-colors shadow-sm"
              >
                Terminal KDS - La Granjita
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
