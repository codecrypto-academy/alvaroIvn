"use client";

/**
 * Header Component
 * Barra de navegación principal con estado de conexión Web3
 */

import React from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Alert } from "./ui/Alert";
import { getUserInfo } from "@/lib/web3";
import { USER_STATUS_LABELS, UserStatus } from "@/contracts/config";

export function Header() {
  const { account, isConnected, isCorrectNetwork, isAdmin, formattedAccount, connect, disconnect } =
    useWallet();

  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userStatus, setUserStatus] = React.useState<UserStatus | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Cargar información del usuario cuando se conecta
  React.useEffect(() => {
    if (account) {
      getUserInfo(account)
        .then((user) => {
          if (user.id > 0) {
            setUserRole(user.role);
            setUserStatus(user.status);
          }
        })
        .catch(() => {
          setUserRole(null);
          setUserStatus(null);
        });
    } else {
      setUserRole(null);
      setUserStatus(null);
    }
  }, [account]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              {/* Logo SVG - Puedes reemplazar con: <img src="/logo.png" alt="Logo" className="w-8 h-8" /> */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-1.5 shadow-md group-hover:shadow-lg transition-shadow">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-primary-700 transition-colors hidden sm:inline">
                Supply Chain Tracker
              </span>
              <span className="text-base font-bold text-gray-800 group-hover:text-primary-700 transition-colors sm:hidden">
                SCT
              </span>
            </Link>

            {/* Navegación */}
            {isConnected && userStatus === UserStatus.Approved && (
              <nav className="hidden md:flex space-x-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>

                {/* Menú según rol: Admin o Usuario normal */}
                {isAdmin ? (
                  <>
                    <Link
                      href="/admin/tokens"
                      className="flex items-center gap-1.5 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tokens
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-1.5 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Usuarios
                    </Link>
                  </>
                ) : (
                  /* Usuarios normales: Tokens y Transferencias */
                  <>
                    <Link
                      href="/tokens"
                      className="flex items-center gap-1.5 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Mis Tokens
                    </Link>
                    <Link
                      href="/transfers"
                      className="flex items-center gap-1.5 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Transferencias
                    </Link>
                  </>
                )}

                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil
                </Link>
              </nav>
            )}
          </div>

          {/* Estado de conexión y menú hamburguesa */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isConnected ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-mono text-gray-600">{formattedAccount}</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {userRole && <Badge variant="info">{userRole}</Badge>}
                    {userStatus !== null && (
                      <Badge
                        variant={
                          userStatus === UserStatus.Approved
                            ? "success"
                            : userStatus === UserStatus.Pending
                            ? "warning"
                            : "danger"
                        }
                      >
                        {USER_STATUS_LABELS[userStatus]}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={disconnect}
                  className="hidden sm:flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden lg:inline">Desconectar</span>
                </Button>
              </>
            ) : (
              <>
                <Button onClick={connect} className="hidden sm:flex">Conectar MetaMask</Button>
                <Button onClick={connect} size="sm" className="sm:hidden">
                  Conectar
                </Button>
              </>
            )}

            {/* Botón hamburguesa móvil */}
            {isConnected && userStatus === UserStatus.Approved && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Abrir menú</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && isConnected && userStatus === UserStatus.Approved && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Información del usuario en móvil */}
              <div className="px-3 py-2 bg-gray-50 rounded-lg mb-2">
                <span className="block text-xs font-mono text-gray-600 truncate">{formattedAccount}</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  {userRole && <Badge variant="info">{userRole}</Badge>}
                  {userStatus !== null && (
                    <Badge
                      variant={
                        userStatus === UserStatus.Approved
                          ? "success"
                          : userStatus === UserStatus.Pending
                          ? "warning"
                          : "danger"
                      }
                    >
                      {USER_STATUS_LABELS[userStatus]}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Enlaces de navegación móvil */}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>

              {/* Menú según rol: Admin o Usuario normal */}
              {isAdmin ? (
                <>
                  <Link
                    href="/admin/tokens"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tokens
                  </Link>
                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Usuarios
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/tokens"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Mis Tokens
                  </Link>
                  <Link
                    href="/transfers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Transferencias
                  </Link>
                </>
              )}

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Perfil
              </Link>

              {/* Botón de desconectar en móvil */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    disconnect();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Desconectar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advertencia de red incorrecta */}
      {isConnected && !isCorrectNetwork && (
        <div className="bg-yellow-50 border-t border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Alert variant="warning">
              Red incorrecta. Por favor, cambia a Anvil Local (chainId: 31337) en MetaMask.
            </Alert>
          </div>
        </div>
      )}
    </header>
  );
}