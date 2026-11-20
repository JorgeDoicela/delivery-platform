"use client";

import React, { createContext, useContext } from "react";

const TenantHostContext = createContext<string>("localhost");

export function TenantHostProvider({
  host,
  children,
}: {
  host: string;
  children: React.ReactNode;
}) {
  return React.createElement(TenantHostContext.Provider, { value: host }, children);
}

export function useTenantHost(): string {
  const serverHost = useContext(TenantHostContext);
  if (typeof window !== "undefined") {
    return window.location.hostname;
  }
  return serverHost || "localhost";
}
