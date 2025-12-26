"use client";

/**
 * Admin Users Page
 * Panel de administración para aprobar/rechazar usuarios
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { getAllUsers, changeStatusUser } from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { UserTable } from "@/components/UserTable";
import { UserStatus, CONTRACT_CONFIG } from "@/contracts/config";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const router = useRouter();
  const { isConnected, isAdmin, signer } = useWallet();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuarios
  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirigir si no está conectado o no es admin
    if (!isConnected || !isAdmin) {
      router.push("/");
      return;
    }

    if (isConnected && isAdmin) {
      loadUsers();
    }
  }, [isConnected, isAdmin, router]);

  // Aprobar usuario
  const handleApprove = async (userAddress: string) => {
    if (!signer) {
      setError("No se pudo obtener el signer");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await changeStatusUser(signer, userAddress, UserStatus.Approved);
      await loadUsers(); // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al aprobar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar usuario
  const handleReject = async (userAddress: string) => {
    if (!signer) {
      setError("No se pudo obtener el signer");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await changeStatusUser(signer, userAddress, UserStatus.Rejected);
      await loadUsers(); // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al rechazar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancelar/Deshabilitar usuario
  const handleCancel = async (userAddress: string) => {
    if (!signer) {
      setError("No se pudo obtener el signer");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await changeStatusUser(signer, userAddress, UserStatus.Canceled);
      await loadUsers(); // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al cancelar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  // Mostrar solo si está conectado y es admin
  if (!isConnected || !isAdmin) {
    return null; // Redirigiendo...
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="mt-2 text-gray-600">
            Administra el estado de los usuarios: aprueba, rechaza, deshabilita o reactiva cuentas
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Usuarios Registrados ({users.length})</CardTitle>
          </CardHeader>
          <CardContent padding={false}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando usuarios...</span>
              </div>
            ) : (
              <UserTable
                users={users}
                onApprove={handleApprove}
                onReject={handleReject}
                onCancel={handleCancel}
                loading={actionLoading}
                adminAddress={CONTRACT_CONFIG.adminAddress}
              />
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter((u) => u.status === UserStatus.Approved).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Aprobados</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {users.filter((u) => u.status === UserStatus.Pending).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pendientes</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {users.filter((u) => u.status === UserStatus.Rejected).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Rechazados</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {users.filter((u) => u.status === UserStatus.Canceled).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Cancelados</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}