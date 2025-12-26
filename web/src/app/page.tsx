"use client";

/**
 * Home Page - Landing / Login / Registro
 *
 * Flujo:
 * 1. No conectado → Botón "Conectar MetaMask"
 * 2. Conectado pero no registrado → Formulario de registro
 * 3. Pendiente → Mensaje de espera
 * 4. Aprobado → Ir a dashboard
 * 5. Rechazado → Mensaje de rechazo
 *
 * MEJORAS VISUALES APLICADAS:
 * - Hero section con gradiente y patrón de nodos blockchain
 * - Cards con sombras, bordes y hover effects
 * - Micro-interacciones en botones y elementos
 * - Footer con identidad Web3
 * - Mejor jerarquía visual y espaciado
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { getUserInfo, requestUserRole } from "@/lib/web3";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Header } from "@/components/Header";
import { ROLES, UserStatus } from "@/contracts/config";
import type { User } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { account, isConnected, signer, connect } = useWallet();

  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.PRODUCER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);

  // Cargar información del usuario cuando se conecta
  useEffect(() => {
    if (account) {
      setLoadingUserInfo(true);
      getUserInfo(account)
        .then((userInfo) => {
          if (userInfo && userInfo.id > 0) {
            setUser(userInfo);
          } else {
            setUser(null);
          }
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoadingUserInfo(false);
        });
    } else {
      setUser(null);
    }
  }, [account]);

  // Manejar solicitud de rol
  const handleRequestRole = async () => {
    if (!signer) {
      setError("No se pudo obtener el signer");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestUserRole(signer, selectedRole);

      // Recargar información del usuario
      const updatedUser = await getUserInfo(account!);
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || "Error al solicitar rol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 relative overflow-hidden">
      {/* Patrón de nodos blockchain de fondo - Identidad Web3 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="blockchain-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Nodos conectados representando blockchain */}
              <circle cx="50" cy="50" r="4" fill="#2563eb"/>
              <circle cx="150" cy="50" r="4" fill="#2563eb"/>
              <circle cx="100" cy="100" r="4" fill="#2563eb"/>
              <circle cx="50" cy="150" r="4" fill="#2563eb"/>
              <circle cx="150" cy="150" r="4" fill="#2563eb"/>
              <line x1="50" y1="50" x2="150" y2="50" stroke="#2563eb" strokeWidth="1"/>
              <line x1="50" y1="50" x2="100" y2="100" stroke="#2563eb" strokeWidth="1"/>
              <line x1="150" y1="50" x2="100" y2="100" stroke="#2563eb" strokeWidth="1"/>
              <line x1="100" y1="100" x2="50" y2="150" stroke="#2563eb" strokeWidth="1"/>
              <line x1="100" y1="100" x2="150" y2="150" stroke="#2563eb" strokeWidth="1"/>
              <line x1="50" y1="150" x2="150" y2="150" stroke="#2563eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blockchain-pattern)"/>
        </svg>
      </div>

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Hero Section Mejorado - Con jerarquía visual clara */}
        <div className="text-center mb-6 space-y-3">
          {/* Título principal con gradiente */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 bg-clip-text text-transparent animate-gradient">
              Supply Chain Tracker
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-blue-600 to-transparent rounded-full"></div>
              <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-blue-600 to-transparent rounded-full"></div>
            </div>
          </div>

          {/* Subtítulo con mejor espaciado */}
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-semibold leading-relaxed">
            Sistema de trazabilidad blockchain para cadenas de suministro
          </p>

          {/* Badges de Web3 - Refuerzan identidad */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full text-sm font-medium text-blue-700 shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Blockchain Seguro
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full text-sm font-medium text-blue-700 shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              Trazabilidad Total
            </span>
          </div>
        </div>

        {/* Contenido principal con cards mejoradas */}
        <div className="max-w-2xl mx-auto mb-8">
          {/* Estado: No conectado */}
          {!isConnected && (
            <Card className="border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Conecta tu Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  {/* Ilustración SVG de wallet */}
                  <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <p className="text-gray-600 text-center">
                  Para usar la aplicación, necesitas conectar tu wallet de MetaMask.
                </p>
                {/* Botón con hover effect mejorado */}
                <Button
                  onClick={connect}
                  className="w-full py-3 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  Conectar MetaMask
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Estado: Conectado pero cargando info */}
          {isConnected && loadingUserInfo && (
            <Card className="border-2 border-blue-100 shadow-xl backdrop-blur-sm bg-white/90">
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 absolute top-0"></div>
                  </div>
                  <span className="text-gray-600">Cargando información...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado: Conectado pero no registrado */}
          {isConnected && !loadingUserInfo && !user && (
            <Card className="border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl text-center">Registro de Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 text-center">
                  Elige tu rol en la cadena de suministro:
                </p>

                <div className="space-y-4">
                  <Select
                    label="Rol"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    options={[
                      { value: ROLES.PRODUCER, label: "Productor" },
                      { value: ROLES.FACTORY, label: "Fábrica" },
                      { value: ROLES.RETAILER, label: "Minorista" },
                      { value: ROLES.CONSUMER, label: "Consumidor" },
                    ]}
                  />

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 rounded-md p-3 shadow-sm">
                    <p className="text-sm text-blue-900 leading-relaxed">
                      <strong className="font-semibold">📌 Nota:</strong> Tu solicitud será revisada por un administrador antes de
                      poder usar la aplicación.
                    </p>
                  </div>

                  {error && <Alert variant="error">{error}</Alert>}

                  <Button
                    onClick={handleRequestRole}
                    loading={loading}
                    className="w-full py-3 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    Solicitar Registro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado: Pendiente de aprobación */}
          {isConnected && !loadingUserInfo && user && user.status === UserStatus.Pending && (
            <Card className="border-2 border-yellow-200 shadow-xl backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                  <span className="text-3xl">⏳</span> Solicitud Pendiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="warning">
                  <div className="space-y-2">
                    <p className="font-semibold">Tu solicitud está siendo revisada</p>
                    <p className="text-sm">
                      Rol solicitado: <strong className="text-yellow-800">{user.role}</strong>
                    </p>
                    <p className="text-sm leading-relaxed">
                      Un administrador revisará tu solicitud pronto. Recibirás acceso una vez aprobada.
                    </p>
                  </div>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Estado: Rechazado */}
          {isConnected && !loadingUserInfo && user && user.status === UserStatus.Rejected && (
            <Card className="border-2 border-red-200 shadow-xl backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                  <span className="text-3xl">❌</span> Solicitud Rechazada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="error">
                  <div className="space-y-2">
                    <p className="font-semibold">Tu solicitud fue rechazada</p>
                    <p className="text-sm">
                      Rol solicitado: <strong className="text-red-800">{user.role}</strong>
                    </p>
                    <p className="text-sm leading-relaxed">
                      Por favor, contacta con el administrador para más información.
                    </p>
                  </div>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Estado: Aprobado → Ir a dashboard */}
          {isConnected && !loadingUserInfo && user && user.status === UserStatus.Approved && (
            <Card className="border-2 border-green-200 shadow-xl backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                 ¡Bienvenido!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="success">
                  <div className="space-y-2">
                    <p className="font-semibold">Tu cuenta está activa</p>
                    <p className="text-sm">
                      Rol: <strong className="text-green-800">{user.role}</strong>
                    </p>
                  </div>
                </Alert>

                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full mt-4 py-3 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Ir al Dashboard →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cards de Features con diseño mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1 - Productor */}
          <Card className="border-2 border-blue-100 shadow-lg hover:shadow-2xl hover:scale-105 hover:border-blue-300 transition-all duration-300 backdrop-blur-sm bg-white/80 group">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-2">
                {/* Ícono con efecto hover */}
                <div className="text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  🏭
                </div>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                  Productor
                </h3>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  Crea tokens de materias primas y productos en el origen de la cadena
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Trazabilidad */}
          <Card className="border-2 border-blue-100 shadow-lg hover:shadow-2xl hover:scale-105 hover:border-blue-300 transition-all duration-300 backdrop-blur-sm bg-white/80 group">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-2">
                <div className="text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  🔄
                </div>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                  Trazabilidad
                </h3>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  Sigue el recorrido completo de cada producto en tiempo real
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Seguridad */}
          <Card className="border-2 border-blue-100 shadow-lg hover:shadow-2xl hover:scale-105 hover:border-blue-300 transition-all duration-300 backdrop-blur-sm bg-white/80 group">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-2">
                <div className="text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  🔒
                </div>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                  Seguridad
                </h3>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  Blockchain garantiza transparencia e inmutabilidad de datos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer con identidad Web3 */}
      <footer className="relative z-10 border-t border-blue-100 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna 1 - Branding */}
            <div className="space-y-2">
              <h4 className="font-bold text-base text-gray-900">Supply Chain Tracker</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Trazabilidad blockchain para cadenas de suministro transparentes y seguras.
              </p>
            </div>

            {/* Columna 2 - Links */}
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-900">Enlaces</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>
                  <a
                    href="https://github.com/codecrypto-academy/alvaroIvn/tree/pfm-25-supplyChainTracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Documentación
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 3 - Tecnología */}
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-900">Tecnología</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Ethereum
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Solidity
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Web3
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Next.js
                </span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-4 border-t border-blue-100 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Supply Chain Tracker. Powered by Blockchain Technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
