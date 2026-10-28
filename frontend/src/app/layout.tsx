import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Inter,
  Outfit,
  Antonio,
  Nunito,
  Geist_Mono,
} from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const antonio = Antonio({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-antonio",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  title: "Delivery | Pedidos Directos y Reparto a Domicilio",
  description: "Plataforma de delivery directa y despacho logístico para nuestras sucursales.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${outfit.variable} ${antonio.variable} ${inter.variable} ${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-canvas text-text-strong font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
