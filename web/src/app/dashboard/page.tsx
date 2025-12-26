"use client";

/**
 * Dashboard Page
 * Resumen personalizado según el rol del usuario
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import {
  getUserInfo,
  getUserTokens,
  getUserTransfers,
  getTransfer,
  getAllUsers,
  getAllTokens,
  getAllTransfers,
} from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TransferStatus, UserStatus } from "@/contracts/config";

export default function DashboardPage() {
  const router = useRouter();
  const { account, isConnected, isAdmin } = useWallet();

  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");

  // Estados para usuarios normales
  const [tokensCount, setTokensCount] = useState(0);
  const [pendingReceivedCount, setPendingReceivedCount] = useState(0);
  const [pendingSentCount, setPendingSentCount] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);

  // Estados para admin
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    producers: 0,
    factories: 0,
    retailers: 0,
    consumers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    rejectedUsers: 0,
    canceledUsers: 0,
    totalTokens: 0,
    originalTokens: 0,
    derivedTokens: 0,
    tokensByProducers: 0,
    tokensByFactories: 0,
    tokensByRetailers: 0,
    totalTransfers: 0,
    pendingTransfers: 0,
    acceptedTransfers: 0,
    rejectedTransfers: 0,
  });

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }
    if (account) {
      loadDashboardData();
    }
  }, [account, isConnected, router, isAdmin]);

  const loadDashboardData = async () => {
    if (!account) return;

    setLoading(true);

    try {
      if (isAdmin) {
        await loadAdminDashboard();
      } else {
        await loadUserDashboard();
      }
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDashboard = async () => {
    if (!account) return;

    // Cargar información del usuario
    const userInfo = await getUserInfo(account);

    // Si el usuario no existe, redirigir al home
    if (!userInfo) {
      router.push("/");
      return;
    }

    setUserRole(userInfo.role);

    // Cargar tokens
    const tokenIds = await getUserTokens(account);
    setTokensCount(tokenIds.length);

    // Cargar transferencias
    const transferIds = await getUserTransfers(account);
    setTotalTransfers(transferIds.length);

    // Cargar detalles de transferencias para contar pendientes
    const transfers = await Promise.all(transferIds.map((id) => getTransfer(id)));

    const pendingReceived = transfers.filter(
      (t) =>
        t.to.toLowerCase() === account.toLowerCase() &&
        t.status === TransferStatus.Pending
    ).length;

    const pendingSent = transfers.filter(
      (t) =>
        t.from.toLowerCase() === account.toLowerCase() &&
        t.status === TransferStatus.Pending
    ).length;

    setPendingReceivedCount(pendingReceived);
    setPendingSentCount(pendingSent);
  };

  const loadAdminDashboard = async () => {
    // Cargar todos los usuarios, tokens y transferencias
    const [users, tokens, transfers] = await Promise.all([
      getAllUsers(),
      getAllTokens(),
      getAllTransfers(),
    ]);

    // Calcular estadísticas de usuarios por rol
    const producers = users.filter((u) => u.role === "PRODUCER").length;
    const factories = users.filter((u) => u.role === "FACTORY").length;
    const retailers = users.filter((u) => u.role === "RETAILER").length;
    const consumers = users.filter((u) => u.role === "CONSUMER").length;

    // Calcular estadísticas de usuarios por estado
    const approvedUsers = users.filter((u) => u.status === UserStatus.Approved).length;
    const pendingUsers = users.filter((u) => u.status === UserStatus.Pending).length;
    const rejectedUsers = users.filter((u) => u.status === UserStatus.Rejected).length;
    const canceledUsers = users.filter((u) => u.status === UserStatus.Canceled).length;

    // Calcular estadísticas de tokens
    const originalTokens = tokens.filter((t) => t.parentId === 0).length;
    const derivedTokens = tokens.filter((t) => t.parentId > 0).length;

    // Calcular tokens por rol (según el creador)
    const tokensByProducers = tokens.filter((t) => {
      const user = users.find((u) => u.userAddress.toLowerCase() === t.creator.toLowerCase());
      return user?.role === "PRODUCER";
    }).length;

    const tokensByFactories = tokens.filter((t) => {
      const user = users.find((u) => u.userAddress.toLowerCase() === t.creator.toLowerCase());
      return user?.role === "FACTORY";
    }).length;

    const tokensByRetailers = tokens.filter((t) => {
      const user = users.find((u) => u.userAddress.toLowerCase() === t.creator.toLowerCase());
      return user?.role === "RETAILER";
    }).length;

    // Calcular estadísticas de transferencias
    const pendingTransfers = transfers.filter((t) => t.status === TransferStatus.Pending).length;
    const acceptedTransfers = transfers.filter((t) => t.status === TransferStatus.Accepted).length;
    const rejectedTransfers = transfers.filter((t) => t.status === TransferStatus.Rejected).length;

    setAdminStats({
      totalUsers: users.length,
      producers,
      factories,
      retailers,
      consumers,
      approvedUsers,
      pendingUsers,
      rejectedUsers,
      canceledUsers,
      totalTokens: tokens.length,
      originalTokens,
      derivedTokens,
      tokensByProducers,
      tokensByFactories,
      tokensByRetailers,
      totalTransfers: transfers.length,
      pendingTransfers,
      acceptedTransfers,
      rejectedTransfers,
    });
  };

  if (!isConnected) {
    return null; // Redirigiendo...
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {isAdmin
              ? "Panel de control del sistema - Métricas y estadísticas generales"
              : "Resumen de tu actividad en la cadena de suministro"}
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando dashboard...</span>
              </div>
            </CardContent>
          </Card>
        ) : isAdmin ? (
          /* Dashboard de Administrador */
          <>
            {/* Sección: Usuarios por Rol */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Usuarios por Rol</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Productores</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.producers}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Fábricas</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.factories}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.586V5L7 4z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Retailers</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.retailers}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Consumidores</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.consumers}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Sección: Estado de Usuarios */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Estado de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Aprobados</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.approvedUsers}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Pendientes</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.pendingUsers}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Rechazados</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.rejectedUsers}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Cancelados</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.canceledUsers}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Sección: Actividad */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Actividad de Tokens y Transferencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Total Tokens</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.totalTokens}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Originales</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.originalTokens}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Derivados</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.derivedTokens}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 font-medium">Transferencias</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{adminStats.totalTransfers}</div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Acceso rápido */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <Link href="/admin/users">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-sm text-gray-900 font-medium">Gestionar Usuarios</span>
                        </div>
                        <p className="text-xs text-gray-600">Aprobar, rechazar y gestionar usuarios</p>
                        {adminStats.pendingUsers > 0 && (
                          <span className="mt-2 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
                            {adminStats.pendingUsers} pendientes
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/tokens">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-sm text-gray-900 font-medium">Ver Tokens del Sistema</span>
                        </div>
                        <p className="text-xs text-gray-600">Visualizar todos los tokens del sistema</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        ) : (
          /* Dashboard de Usuario Normal */
          <>
            {/* Métricas principales - Adaptadas según rol */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Todos los roles: Tokens */}
              <Card>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600">{tokensCount}</div>
                    <div className="text-sm text-gray-600 mt-2">Tokens</div>
                  </div>
                </CardContent>
              </Card>

              {/* FACTORY, RETAILER, CONSUMER: Pendientes Recibidas */}
              {userRole !== "PRODUCER" && (
                <Card>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-600">
                        {pendingReceivedCount}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Pendientes Recibidas</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PRODUCER, FACTORY, RETAILER: Pendientes Enviadas */}
              {userRole !== "CONSUMER" && (
                <Card>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">{pendingSentCount}</div>
                      <div className="text-sm text-gray-600 mt-2">Pendientes Enviadas</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Todos los roles: Total Transferencias */}
              <Card>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{totalTransfers}</div>
                    <div className="text-sm text-gray-600 mt-2">Total Transferencias</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {userRole === "CONSUMER" ? "Mis Tokens" : "Gestionar Tokens"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {userRole === "CONSUMER"
                      ? "Visualiza los tokens que has recibido y su trazabilidad completa."
                      : "Crea nuevos tokens, visualiza tus tokens existentes o transfiere a otros participantes de la cadena."}
                  </p>
                  <div className="flex gap-3">
                    <Link href="/tokens" className={userRole === "CONSUMER" ? "w-full" : "flex-1"}>
                      <Button variant="secondary" className="w-full">
                        Ver Tokens
                      </Button>
                    </Link>
                    {userRole !== "CONSUMER" && (
                      <Link href="/tokens/create" className="flex-1">
                        <Button className="w-full">Crear Token</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transferencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {userRole === "CONSUMER"
                      ? "Acepta o rechaza las transferencias de tokens que recibes."
                      : "Gestiona las transferencias de tokens. Acepta o rechaza las transferencias recibidas."}
                  </p>
                  <Link href="/transfers">
                    <Button className="w-full">
                      Ir a Transferencias
                      {pendingReceivedCount > 0 && (
                        <span className="ml-2 bg-yellow-500 text-white rounded-full px-2 py-1 text-xs">
                          {pendingReceivedCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Información según rol */}
            <Card>
              <CardHeader>
                <CardTitle>Tu Rol: {userRole}</CardTitle>
              </CardHeader>
              <CardContent>
                {userRole === "PRODUCER" && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Como <strong>Productor</strong>, eres el punto inicial de la cadena de
                      suministro.
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Crea tokens que representan materias primas o productos</li>
                      <li>Transfiere tokens a Fábricas (FACTORY)</li>
                      <li>Mantén la trazabilidad de tus productos desde el origen</li>
                    </ul>
                  </div>
                )}

                {userRole === "FACTORY" && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Como <strong>Fábrica</strong>, procesas materias primas en productos
                      terminados.
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Recibe tokens de Productores (PRODUCER)</li>
                      <li>Crea nuevos tokens derivados (productos procesados)</li>
                      <li>Transfiere productos a Minoristas (RETAILER)</li>
                    </ul>
                  </div>
                )}

                {userRole === "RETAILER" && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Como <strong>Minorista</strong>, distribuyes productos a consumidores finales.
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Recibe productos de Fábricas (FACTORY)</li>
                      <li>Transfiere productos a Consumidores (CONSUMER)</li>
                      <li>Mantén el stock y la trazabilidad de productos</li>
                    </ul>
                  </div>
                )}

                {userRole === "CONSUMER" && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Como <strong>Consumidor</strong>, eres el punto final de la cadena.
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Recibe productos de Minoristas (RETAILER)</li>
                      <li>Visualiza la trazabilidad completa del producto</li>
                      <li>Los consumidores no pueden transferir tokens</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
