import Link from "next/link";
import Image from "next/image";
import { Radio } from "lucide-react";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-dark text-text-inverse-strong select-none">
      {/* Top Header Ergonómico con Identidad La Granjita */}
      <header className="h-16 bg-surface-dark-card border-b border-surface-dark-border px-4 sm:px-6 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
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
              className="font-black text-lg tracking-tight text-white block leading-none uppercase font-display"
            >
              LA GRANJITA
            </span>
            <span className="text-[10px] tracking-widest text-brand-accent font-bold uppercase block mt-0.5">
              Reparto Móvil • ID: driver-01
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 bg-status-success/20 text-status-success border border-status-success/40 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Radio className="w-3 h-3 animate-pulse text-status-success" />
          <span>GPS Satelital Activo</span>
        </div>
      </header>

      {/* Contenido Táctil a Ancho Completo */}
      <main className="flex-1 p-4 flex flex-col w-full">
        {children}
      </main>
    </div>
  );
}
