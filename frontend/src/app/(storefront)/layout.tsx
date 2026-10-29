import Link from "next/link";
import Image from "next/image";
import { MapPin, Search, User } from "lucide-react";
import { CartButtonBadge } from "@/features/cart";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas">
      {/* Header Comercial Blanco Limpio estilo KFC */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] sm:h-[76px] flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
          
          {/* Bloque Izquierdo: Logo + Navegación Agrupada con Espaciado estilo KFC */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            {/* Logo Oficial La Granjita Asadero sin fondo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                <Image
                  src="/images/identidad/logo.png"
                  alt="Logo La Granjita Asadero"
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <span
                  data-display-brand
                  className="font-black text-2xl sm:text-[26px] tracking-tight text-brand-primary block leading-none uppercase font-display"
                >
                  LA GRANJITA
                </span>
                <span className="text-[10px] tracking-widest text-text-muted font-bold uppercase block mt-0.5">
                  Asadero
                </span>
              </div>
            </Link>

            {/* Enlaces de Navegación estilo KFC con Anclas a la Misma Página */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-[13px] sm:text-sm font-semibold text-neutral-800">
              <a href="#catalogo" className="hover:text-brand-primary transition-colors">
                Ordenar
              </a>
              <a href="#sucursales" className="hover:text-brand-primary transition-colors">
                Restaurantes
              </a>
              <Link href="/rastreo" className="hover:text-brand-primary transition-colors">
                Rastrear Pedido
              </Link>
              <a href="#sucursales" className="hover:text-brand-primary transition-colors">
                Nosotros
              </a>
            </nav>
          </div>

          {/* Bloque Derecho: Buscador Píldora + Perfil + Botón Ingresar + Bolsa estilo KFC */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 shrink-0">
            {/* Buscador Píldora con ancla al catálogo */}
            <div className="hidden md:flex items-center">
              <a
                href="#catalogo"
                className="flex items-center gap-2.5 px-4 py-2 w-56 sm:w-64 md:w-72 lg:w-80 bg-[#f8f7f5] hover:bg-neutral-200/70 rounded-full transition-colors border border-neutral-200/60 text-neutral-500 group"
              >
                <Search className="w-4 h-4 text-neutral-500 group-hover:text-brand-primary transition-colors shrink-0" />
                <span className="text-xs sm:text-sm text-neutral-400 font-normal">Buscar</span>
              </a>
            </div>

            {/* Icono Perfil con etiqueta inferior estilo KFC */}
            <Link
              href="/rastreo"
              className="flex flex-col items-center justify-center text-neutral-800 hover:text-brand-primary transition-colors px-1 shrink-0"
              title="Mi Perfil"
            >
              <User className="w-5 h-5 text-neutral-800 stroke-[1.8]" />
              <span className="text-[10px] font-semibold text-neutral-700 leading-none mt-1">Perfil</span>
            </Link>

            {/* Botón Píldora Negra estilo KFC "Ingresar" */}
            <Link
              href="/rastreo"
              className="bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold px-4 sm:px-5 py-2 rounded-full transition-colors shadow-sm shrink-0"
            >
              Ingresar
            </Link>

            {/* Bolsa de Compras con Badge Rojo estilo KFC */}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
