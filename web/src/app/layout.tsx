/**
 * Root Layout
 * Layout principal de la aplicación con Web3Provider
 */

import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/contexts/Web3Context";

export const metadata: Metadata = {
  title: "Supply Chain Tracker",
  description: "Trazabilidad blockchain para supply chain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}