import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Única fuente de la verdad: Cargar variables de entorno desde el .env canónico de la raíz
const candidatePaths = [
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), ".env"),
];
for (const envCandidate of candidatePaths) {
  if (fs.existsSync(envCandidate)) {
    try {
      const content = fs.readFileSync(envCandidate, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const idx = trimmed.indexOf("=");
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
          (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
        ) {
          val = val.slice(1, -1);
        }
        if (typeof process.env[key] === "undefined" || process.env[key] === "") {
          process.env[key] = val;
        }
      }
      break;
    } catch {
      // Ignorar fallos de lectura en runtime aislado
    }
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Desactivar generacion automatica de AGENTS.md en la subcarpeta frontend
  agentRules: false,
  async rewrites() {
    // En produccion el enrutamiento de API y SignalR lo gestiona Nginx perimetralmente
    if (process.env.NODE_ENV === "production") {
      return [];
    }

    // Soporte exclusivo para desarrollo local (pnpm dev sin Nginx en la maquina del programador)
    const backendDevUrl = process.env.INTERNAL_API_URL || "http://localhost:5005";
    return [
      {
        source: "/api/:path*",
        destination: `${backendDevUrl}/api/:path*`,
      },
      {
        source: "/hubs/:path*",
        destination: `${backendDevUrl}/hubs/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/r/:slug", destination: "/:slug", permanent: true },
      { source: "/checkout", destination: "/finalizar-pedido", permanent: true },
      { source: "/track", destination: "/rastreo", permanent: true },
      { source: "/track/:orderId", destination: "/rastreo/:orderId", permanent: true },
      { source: "/kitchen", destination: "/cocina", permanent: true },
      { source: "/admin/branches", destination: "/admin/sucursales", permanent: true },
      { source: "/admin/inventory", destination: "/admin/inventario", permanent: true },
      { source: "/active-delivery", destination: "/repartidor", permanent: true },
    ];
  },
};

export default nextConfig;
