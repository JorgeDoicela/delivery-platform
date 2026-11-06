"use client";

import React, { useState } from "react";

export function PlatformAffiliationSection() {
  const [leadForm, setLeadForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitted(true);
  };

  return (
    <section
      id="afiliacion"
      className="max-w-[1240px] mx-auto scroll-mt-24 space-y-6"
    >
      <div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1">
          EXPANSIÓN COMERCIAL B2B
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-tight font-display">
          INTEGRA TU RESTAURANTE A LA PLATAFORMA
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-brand-primary text-white rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] font-bold tracking-widest uppercase text-brand-accent block mb-1">
              PROGRAMA DE COMERCIOS AFILIADOS
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight font-display leading-tight mb-2">
              TU PROPIA TIENDA EN LÍNEA EN MINUTOS
            </h3>
            <p className="text-xs text-white/90 leading-relaxed font-sans">
              Opera con 0% de comisiones por pedido, cobro directo a tu cuenta bancaria, facturación electrónica SRI y despacho geolocalizado para cualquier giro gastronómico.
            </p>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-3xl p-4 shadow-xs divide-y divide-surface-border text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-text-strong font-display">
                AISLAMIENTO EN BASE DE DATOS
              </span>
              <span className="font-mono text-[11px] font-bold text-brand-primary">
                TenantId
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-text-strong font-display">
                PLANTILLAS Y DISEÑO A MEDIDA
              </span>
              <span className="font-mono text-[11px] font-bold text-text-strong">
                100% Libre
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-text-strong font-display">
                ACTIVACIÓN DE MARCA
              </span>
              <span className="font-mono text-[11px] font-bold text-brand-primary">
                Inmediata
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-8 lg:p-12 shadow-sm">
          {leadSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display">
                SOLICITUD REGISTRADA CORRECTAMENTE
              </h3>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
                Hemos recibido los datos de tu establecimiento. Nuestro equipo comercial se comunicará contigo en breve para coordinar la activación de tu tienda.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setLeadSubmitted(false)}
                  className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs uppercase tracking-wider font-display px-8 py-3.5 rounded-full shadow-md transition-all cursor-pointer"
                >
                  ENVIAR OTRA CONSULTA
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="pb-3 border-b border-surface-border flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display">
                    SOLICITAR DEMO O AFILIACIÓN
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Registra los datos de tu establecimiento para configurar tu tienda en la plataforma.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    NOMBRE COMERCIAL DEL ESTABLECIMIENTO
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pizzería Napoli / Burger Studio / Asadero El Brasero"
                    value={leadForm.businessName}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, businessName: e.target.value })
                    }
                    className="w-full bg-surface-canvas border border-surface-border rounded-xl min-h-[48px] px-4 py-2.5 text-sm text-text-strong focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-colors placeholder:text-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    PERSONA DE CONTACTO
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre y apellido"
                    value={leadForm.contactName}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, contactName: e.target.value })
                    }
                    className="w-full bg-surface-canvas border border-surface-border rounded-xl min-h-[48px] px-4 py-2.5 text-sm text-text-strong focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-colors placeholder:text-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    TELÉFONO / WHATSAPP
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0991234567"
                    value={leadForm.phone}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, phone: e.target.value })
                    }
                    className="w-full bg-surface-canvas border border-surface-border rounded-xl min-h-[48px] px-4 py-2.5 text-sm text-text-strong font-mono focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-colors placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[50px] bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-sm uppercase tracking-wider font-display rounded-full shadow-md shadow-brand-primary/20 transition-all cursor-pointer"
                >
                  ENVIAR SOLICITUD DE AFILIACIÓN
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
