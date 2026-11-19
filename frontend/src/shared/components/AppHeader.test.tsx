import React from 'react';
import Link from 'next/link';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AppHeader } from './AppHeader';

describe('AppHeader Component', () => {
  it('renders declarative brand, leadingAction, navigation, and actions correctly', () => {
    const html = renderToString(
      <AppHeader
        brand={{
          name: 'La Granjita',
          logo: '/images/platform/logo.png',
          href: '/la-granjita',
          subtitle: 'Reparto Móvil',
        }}
        leadingAction={<button aria-label="Abrir menú">Menú</button>}
        navigation={<Link href="/menu">Menú de Tienda</Link>}
        actions={<button aria-label="Carrito">Carrito (0)</button>}
      />
    );

    expect(html).toContain('La Granjita');
    expect(html).toContain('Reparto Móvil');
    expect(html).toContain('Abrir menú');
    expect(html).toContain('Menú de Tienda');
    expect(html).toContain('Carrito (0)');
    expect(html).toContain('/la-granjita');
  });

  it('renders correctly in compound components mode', () => {
    const html = renderToString(
      <AppHeader>
        <AppHeader.Leading>
          <button aria-label="Volver">Volver</button>
        </AppHeader.Leading>
        <AppHeader.Brand
          name="Mesafy Hub"
          logo="/images/platform/logo.png"
          subtitle="Panel de Control"
        />
        <AppHeader.Nav>
          <Link href="/pedidos">Pedidos en Curso</Link>
        </AppHeader.Nav>
        <AppHeader.Actions>
          <button aria-label="Perfil">Perfil de Usuario</button>
        </AppHeader.Actions>
      </AppHeader>
    );

    expect(html).toContain('Mesafy Hub');
    expect(html).toContain('Panel de Control');
    expect(html).toContain('Volver');
    expect(html).toContain('Pedidos en Curso');
    expect(html).toContain('Perfil de Usuario');
  });

  it('applies visibility and scroll backdrop-blur classes based on props', () => {
    const visibleHtml = renderToString(
      <AppHeader isVisible={true} isScrolled={false} pinOnDesktop={false} />
    );
    expect(visibleHtml).toContain('translate-y-0');
    expect(visibleHtml).not.toContain('backdrop-blur-md');

    const scrolledHiddenHtml = renderToString(
      <AppHeader isVisible={false} isScrolled={true} pinOnDesktop={false} />
    );
    expect(scrolledHiddenHtml).toContain('-translate-y-full');
    expect(scrolledHiddenHtml).toContain('backdrop-blur-md');

    const desktopPinnedHtml = renderToString(
      <AppHeader isVisible={false} isScrolled={false} pinOnDesktop={true} />
    );
    expect(desktopPinnedHtml).toContain('md:translate-y-0');
  });

  it('respects maxWidth variants', () => {
    const fullHtml = renderToString(
      <AppHeader maxWidth="full" />
    );
    expect(fullHtml).toContain('w-full');

    const sixLHtml = renderToString(
      <AppHeader maxWidth="6xl" />
    );
    expect(sixLHtml).toContain('max-w-6xl');
  });
});
