import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { CartButtonBadge } from "@/features/cart";
import { StorefrontThemeScope } from "@/shared/components/StorefrontThemeScope";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontThemeScope>
      {/* Top Bar Operativa */}
      <div className="bg-surface-dark text-text-inverse-muted text-xs py-1.5 px-4 border-b border-surface-dark-border">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            <span>Horno encendido: Tomando pedidos para almuerzo y cena</span>
          </div>
          <div className="flex items-center gap-4 hidden sm:flex">
            <span>Envío estándar: $1.50</span>
            <Link href="/track" className="hover:text-text-inverse-strong transition-colors">
              Rastrear Pedido
            </Link>
          </div>
        </div>
      </div>

      {/* Header Comercial */}
      <header className="sticky top-9 z-40 bg-surface-card/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-text-inverse-strong font-bold text-xl shadow-md shadow-brand-primary/20 group-hover:bg-brand-primary-hover transition-colors">
              D
            </div>
            <div>
              <span
                data-display-brand
                className="font-extrabold text-2xl tracking-tight text-text-strong block leading-none uppercase"
              >
                DELIVERY
              </span>
              <span className="text-[10px] tracking-widest text-text-muted font-semibold uppercase block mt-0.5">
                Canal Directo
              </span>
            </div>
          </Link>

          {/* Selector Rápido de Cobertura */}
          <div className="flex-1 max-w-md hidden md:flex items-center">
            <Link
              href="/checkout"
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text-base bg-surface-card-hover hover:bg-surface-border/50 rounded-full transition-colors border border-surface-border"
            >
              <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
              <span className="truncate">¿Dónde entregamos? Selecciona tu ubicación</span>
              <Search className="w-3.5 h-3.5 text-text-muted ml-auto" />
            </Link>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <CartButtonBadge />
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface-dark text-text-inverse-muted text-xs border-t border-surface-dark-border mt-12 py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center text-text-inverse-strong font-bold text-sm">
                D
              </div>
              <span className="font-bold text-text-inverse-strong text-base">DELIVERY</span>
            </div>
            <p className="text-text-inverse-muted leading-relaxed">
              Plataforma directa de pedidos y despacho logístico sin comisiones abusivas de intermediarios.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-text-inverse-strong uppercase tracking-wider text-[11px] mb-3">
              Sucursales Operativas
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-accent mt-0.5 shrink-0" />
                <span>Sucursal Norte: Av. Amazonas y República</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-accent mt-0.5 shrink-0" />
                <span>Sucursal Sur: Av. Rodrigo de Chávez y Maldonado</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-inverse-strong uppercase tracking-wider text-[11px] mb-3">
              Garantía y Facturación
            </h4>
            <p className="text-text-inverse-muted leading-relaxed mb-2">
              Comprobantes electrónicos autorizados emitidos directamente al SRI. Pagos seguros contra entrega y transferencias verificadas.
            </p>
            <span className="text-[11px] text-text-inverse-subtle">© 2026 Delivery Platform</span>
          </div>
        </div>
      </footer>
    </StorefrontThemeScope>
  );
}
