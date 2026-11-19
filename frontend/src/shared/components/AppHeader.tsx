'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface AppHeaderBrandProps {
  /** Nombre principal de la marca o comercio */
  name: string;
  /** URL o ruta del logo de la marca */
  logo: string;
  /** Enlace de destino al pulsar el logo o nombre (por defecto '/') */
  href?: string;
  /** Subtítulo contextual o rol operativo (ej: 'Operaciones & Cocina', 'Reparto Móvil', etc.) */
  subtitle?: React.ReactNode;
  /** Eslogan comercial o descripción corta */
  tagline?: string;
  /** Color de énfasis opcional para el nombre ('primary' | 'strong') */
  variant?: 'primary' | 'strong';
  /** Callback al hacer click */
  onClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
}

export function AppHeaderBrand({
  name,
  logo,
  href = '/',
  subtitle,
  tagline,
  variant = 'strong',
  onClick,
  className = '',
}: AppHeaderBrandProps) {
  const brandTextColor =
    variant === 'primary' ? 'text-brand-primary' : 'text-text-strong';

  const content = (
    <>
      <div className="relative w-7 h-7 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
        <Image
          src={logo}
          alt={`Logo ${name}`}
          width={36}
          height={36}
          priority
          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="min-w-0 flex flex-col justify-center">
        <span
          data-display-brand
          className={`font-black text-base sm:text-xl tracking-tight block leading-none uppercase font-display truncate max-w-[130px] xs:max-w-[160px] sm:max-w-none ${brandTextColor}`}
        >
          {name}
        </span>
        {(subtitle || tagline) && (
          <span className="text-[9px] sm:text-[10px] tracking-widest text-text-muted font-bold uppercase mt-0.5 truncate hidden xs:block">
            {subtitle || tagline}
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-2 sm:gap-2.5 group min-w-0 shrink select-none ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-2.5 min-w-0 shrink select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {content}
    </div>
  );
}

export interface AppHeaderLeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function AppHeaderLeading({
  children,
  className = '',
}: AppHeaderLeadingProps) {
  return (
    <div className={`flex items-center shrink-0 ${className}`}>{children}</div>
  );
}

export interface AppHeaderNavProps {
  children: React.ReactNode;
  className?: string;
}

export function AppHeaderNav({
  children,
  className = '',
}: AppHeaderNavProps) {
  return (
    <nav
      className={`hidden md:flex items-center gap-1.5 sm:gap-4 lg:gap-6 text-xs sm:text-sm font-display uppercase tracking-wider ${className}`}
    >
      {children}
    </nav>
  );
}

export interface AppHeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function AppHeaderActions({
  children,
  className = '',
}: AppHeaderActionsProps) {
  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-3 text-xs shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}

export interface AppHeaderProps {
  /** Configuración de identidad de marca */
  brand?: AppHeaderBrandProps;
  /** Control a la izquierda del logo (ej: menú hamburguesa móvil o botón volver) */
  leadingAction?: React.ReactNode;
  /** Navegación central o de escritorio (enlaces, tabs, buscador) */
  navigation?: React.ReactNode;
  /** Acciones a la derecha (selectores, switches, UserNav, Carrito, Botón Salir, etc.) */
  actions?: React.ReactNode;
  /** Contenido modular libre si se prefiere componer usando subcomponentes */
  children?: React.ReactNode;
  /** Visibilidad manual o gobernada por useSmartScrollHeader */
  isVisible?: boolean;
  /** Si la página tiene scroll acumulado para activar efecto vidrio esmerilado */
  isScrolled?: boolean;
  /** Si en pantallas de escritorio (md+) debe permanecer siempre fija aunque en móvil se oculte al scrollear */
  pinOnDesktop?: boolean;
  /** Ancho máximo del contenedor interior */
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl';
  /** Clases CSS adicionales para la etiqueta <header> */
  className?: string;
  /** Clases CSS adicionales para el contenedor interior */
  innerClassName?: string;
  /** Callback al recibir foco de teclado para asegurar visibilidad accesible */
  onFocus?: () => void;
}

export function AppHeader({
  brand,
  leadingAction,
  navigation,
  actions,
  children,
  isVisible = true,
  isScrolled = false,
  pinOnDesktop = true,
  maxWidth = '7xl',
  className = '',
  innerClassName = '',
  onFocus,
}: AppHeaderProps) {
  const visibilityClass = isVisible
    ? 'translate-y-0 opacity-100'
    : pinOnDesktop
      ? '-translate-y-full opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto'
      : '-translate-y-full opacity-0 pointer-events-none';

  const blurClass = isScrolled ? 'bg-surface-card/95 backdrop-blur-md' : '';

  const maxWidthClass =
    maxWidth === 'full'
      ? 'w-full'
      : maxWidth === '6xl'
        ? 'max-w-6xl mx-auto'
        : maxWidth === '5xl'
          ? 'max-w-5xl mx-auto'
          : 'max-w-7xl mx-auto';

  return (
    <header
      onFocus={onFocus}
      className={`sticky top-0 z-40 bg-surface-card border-b border-surface-border shrink-0 shadow-xs transition-all duration-300 ease-in-out will-change-transform ${visibilityClass} ${blurClass} ${className}`}
    >
      <div
        className={`${maxWidthClass} px-2.5 sm:px-6 lg:px-8 h-14 sm:h-[70px] flex items-center justify-between gap-2 sm:gap-6 ${innerClassName}`}
      >
        {children ? (
          children
        ) : (
          <>
            {/* Lado Izquierdo: Acción primaria (Hamburguesa/Volver) + Marca + Navegación */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-7 min-w-0 shrink">
              {leadingAction && (
                <AppHeaderLeading>{leadingAction}</AppHeaderLeading>
              )}
              {brand && <AppHeaderBrand {...brand} />}
              {navigation && <AppHeaderNav>{navigation}</AppHeaderNav>}
            </div>

            {/* Lado Derecho: Acciones contextuales del rol */}
            {actions && <AppHeaderActions>{actions}</AppHeaderActions>}
          </>
        )}
      </div>
    </header>
  );
}

// Asignación de subcomponentes para composición fluida
AppHeader.Brand = AppHeaderBrand;
AppHeader.Leading = AppHeaderLeading;
AppHeader.Nav = AppHeaderNav;
AppHeader.Actions = AppHeaderActions;
