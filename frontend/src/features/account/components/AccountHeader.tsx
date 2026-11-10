"use client";

import { ShieldCheck, Mail, Phone } from "lucide-react";
import type { AccountProfile } from "../types";

interface AccountHeaderProps {
  profile: AccountProfile | null;
  isLoading: boolean;
}

export function AccountHeader({ profile, isLoading }: AccountHeaderProps) {
  if (isLoading || !profile) {
    return (
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-200" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-neutral-200 rounded-lg" />
            <div className="h-4 w-64 bg-neutral-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "CL";

  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white font-black text-xl flex items-center justify-center font-display shrink-0 tracking-wider">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-neutral-900 font-display uppercase tracking-tight">
                {profile.fullName || "Cliente de la Plataforma"}
              </h1>
              {profile.isEmailVerified && (
                <span
                  title="Cuenta de correo verificada"
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-full"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
                  <span>Verificada</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                {profile.email}
              </span>
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de actividad */}
        <div className="flex items-center gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
          <div className="flex-1 sm:flex-initial text-center px-4 py-2 bg-neutral-50 rounded-2xl border border-neutral-100">
            <span className="block text-xl font-black text-neutral-900 font-display">
              {profile.activeOrdersCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              En Curso
            </span>
          </div>
          <div className="flex-1 sm:flex-initial text-center px-4 py-2 bg-neutral-50 rounded-2xl border border-neutral-100">
            <span className="block text-xl font-black text-neutral-900 font-display">
              {profile.totalOrdersCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Historial
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
