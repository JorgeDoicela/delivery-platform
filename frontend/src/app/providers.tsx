"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { TenantThemeProvider } from "@/features/tenant";
import { useAuthStore } from "@/features/auth";

function SessionSyncProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Sincronizar y validar sesión en cliente al arrancar la aplicación
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutos de caché por defecto
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TenantThemeProvider>
        <SessionSyncProvider>{children}</SessionSyncProvider>
      </TenantThemeProvider>
    </QueryClientProvider>
  );
}
