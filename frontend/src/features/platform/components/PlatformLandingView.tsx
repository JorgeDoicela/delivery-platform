"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Store,
  MapPin,
  UtensilsCrossed,
  MessageSquare,
} from "lucide-react";
import { usePublicTenantsQuery } from "@/features/tenant";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";

export function PlatformLandingView() {
  const { data } = usePublicTenantsQuery();
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const tenants = data?.tenants ?? [];

  const [leadForm, setLeadForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    city: "Quito",
    restaurantType: "Asadero de Pollos",
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitted(true);
  };

  return (
    <div className="w-full space-y-20 pb-20">
      {/* 1. Hero Institucional SaaS B2B */}
      <section className="relative overflow-hidden bg-neutral-950 text-white py-20 sm:py-28 px-4 sm:px-8 border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-neutral-950 to-neutral-950 -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-amber-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <Flame className="w-4 h-4 text-brand-primary" />
            <span>Infraestructura Gastronómica para Asaderos & Parrillas</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none font-display">
            La Plataforma de Pedidos & Cocina que tu Asadero Necesita
          </h1>

          <p className="text-neutral-300 text-sm sm:text-lg max-w-3xl mx-auto leading-relaxed font-sans">
            Menú web propio sin intermediarios, pantallas táctiles KDS en cocina en tiempo real, geocercas satelitales PostGIS y facturación electrónica SRI unificada.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#restaurantes"
              className="px-8 py-4 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display shadow-2xl transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
            >
              <span>Ver Restaurantes Afiliados</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#afiliacion"
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/20 backdrop-blur-md transition-all inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-amber-300" />
              <span>Solicitar Demo para mi Negocio</span>
            </a>
          </div>

          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left border-t border-white/10 text-xs">
            <div>
              <span className="font-mono text-xl sm:text-2xl font-black text-white block">0%</span>
              <span className="text-neutral-400 text-[11px] leading-tight">Comisiones por pedido</span>
            </div>
            <div>
              <span className="font-mono text-xl sm:text-2xl font-black text-brand-primary block">&lt; 20m</span>
              <span className="text-neutral-400 text-[11px] leading-tight">Throttling por capacidad</span>
            </div>
            <div>
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400 block">PostGIS</span>
              <span className="text-neutral-400 text-[11px] leading-tight">Geocercas poligonales</span>
            </div>
            <div>
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 block">SRI Web</span>
              <span className="text-neutral-400 text-[11px] leading-tight">Facturación autorizada</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Vitrina de Restaurantes Afiliados a la Red */}
      <section id="restaurantes" className="max-w-[1240px] mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block">
            Red de Asadores & Cortes
          </span>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950 font-display">
            Nuestros Restaurantes Afiliados
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600">
            Cada comercio cuenta con su propia identidad visual, catálogo exclusivo y cobertura de entrega satelital. Selecciona una marca para ordenar:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tenants.map((t) => (
            <article
              key={t.slug}
              className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
            >
              <div>
                <div
                  className="h-3 w-full"
                  style={{ backgroundColor: t.brandPrimaryColor }}
                />
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0"
                        style={{ backgroundColor: t.brandPrimaryColor }}
                      >
                        <Store className="w-6 h-6" />
                      </span>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-neutral-950 font-display group-hover:text-brand-primary transition-colors">
                          {t.name}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-sans">
                          {t.tagline}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Envío ${t.baseDeliveryFee.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed min-h-[3rem]">
                    {t.description}
                  </p>

                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
                      <span>{t.primaryBranchAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{t.activeBranchesCount} {t.activeBranchesCount === 1 ? "sucursal con cobertura" : "sucursales con cobertura"} PostGIS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0">
                <Link
                  href={`/r/${t.slug}`}
                  onClick={() => setTenantSlug(t.slug)}
                  className="w-full py-4 rounded-full text-white text-xs font-black uppercase tracking-wider font-display flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 hover:opacity-95"
                  style={{ backgroundColor: t.brandPrimaryColor }}
                >
                  <span>Entrar al Menú de {t.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Características Técnicas para Dueños de Restaurantes (B2B Showcase) */}
      <section className="bg-neutral-900 text-white py-16 px-4 sm:px-8 border-y border-neutral-800">
        <div className="max-w-[1240px] mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent block">
              Tecnología Propietaria
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-display">
              ¿Por qué los mejores asaderos usan esta plataforma?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-base font-black uppercase tracking-tight text-white font-display">
                Terminales KDS en Cocina
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Pantallas táctiles sincronizadas por SignalR con alerta sonora continua. Cero comandas perdidas o tickets de papel grasosos.
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-base font-black uppercase tracking-tight text-white font-display">
                Control de Horno en 20 Min
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Throttling inteligente por Redis. Si el asador llega a su capacidad de presas, el sistema extiende el tiempo de entrega automáticamente.
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-base font-black uppercase tracking-tight text-white font-display">
                Geocercas Poligonales
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Dibujadas con PostGIS exacto. Solo permites pedidos donde tus motorizados realmente llegan a tiempo y la comida llega caliente.
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                04
              </div>
              <h3 className="text-base font-black uppercase tracking-tight text-white font-display">
                Facturación SRI Integrada
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Emisión automática de XML autorizados ante el SRI. Compatible con puntos de emisión por local y esquemas de consumidor final o RUC.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Módulo de Afiliación B2B y Captación */}
      <section id="afiliacion" className="max-w-[1000px] mx-auto px-4 sm:px-8 scroll-mt-24">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block">
              Digitaliza tu Asadero Hoy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950 font-display">
              ¿Administras un asadero o restaurante de carnes? Te ayudamos.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Únete a la plataforma y obtén tu propia landing page con tus colores, catálogo de combos, geocercas satelitales y panel de cocina KDS listo para operar en menos de 48 horas.
            </p>

            <div className="space-y-2 pt-2 text-xs font-semibold text-neutral-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Puesta en marcha con tu personal de cocina y despacho</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cobro directo a tu propia cuenta bancaria sin retenciones</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Soporte técnico continuo y actualizaciones de software</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
            {leadSubmitted ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-neutral-950 font-display">
                  Solicitud Recibida
                </h3>
                <p className="text-xs text-neutral-600">
                  Un asesor de operaciones se contactará al número provisto para coordinar la demostración técnica de la plataforma.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Nombre del Restaurante / Asadero
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Asadero Don Pollo"
                    value={leadForm.businessName}
                    onChange={(e) => setLeadForm({ ...leadForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Tu Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Paredes"
                    value={leadForm.contactName}
                    onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Teléfono Celular / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 0991234567"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900 font-mono focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display shadow-md transition-all active:scale-95"
                >
                  Solicitar Afiliación / Demo
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

