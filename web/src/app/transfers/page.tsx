"use client";

/**
 * Transfers Page
 * Lista todas las transferencias del usuario con opciones para aceptar/rechazar
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import {
  getUserTransfers,
  getTransfer,
  acceptTransfer,
  rejectTransfer,
} from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { TransferList } from "@/components/TransferList";
import { TransferStatus } from "@/contracts/config";
import type { Transfer } from "@/types";

export default function TransfersPage() {
  const router = useRouter();
  const { account, signer, isConnected } = useWallet();

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar transferencias del usuario
  const loadTransfers = async () => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const transferIds = await getUserTransfers(account);

      const transfersData = await Promise.all(
        transferIds.map((id) => getTransfer(id))
      );

      // Ordenar por ID descendente (más recientes primero)
      transfersData.sort((a, b) => b.id - a.id);

      setTransfers(transfersData);
    } catch (err: any) {
      setError(err.message || "Error al cargar transferencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }
    if (account) {
      loadTransfers();
    }
  }, [isConnected, account, router]);

  // Aceptar transferencia
  const handleAccept = async (transferId: number) => {
    if (!signer) {
      setError("No se pudo obtener el signer");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await acceptTransfer(signer, transferId);
      await loadTransfers(); // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al aceptar transferencia");
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar transferencia
  const handleReject = async (transferId: number) => {
    if (!signer) {
      setError("No se pudo obtener el signer");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await rejectTransfer(signer, transferId);
      await loadTransfers(); // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al rechazar transferencia");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isConnected) {
    return null; // Redirigiendo...
  }

  // Estadísticas
  const pendingReceived = transfers.filter(
    (t) =>
      t.to.toLowerCase() === account?.toLowerCase() &&
      t.status === TransferStatus.Pending
  ).length;

  const pendingSent = transfers.filter(
    (t) =>
      t.from.toLowerCase() === account?.toLowerCase() &&
      t.status === TransferStatus.Pending
  ).length;

  const accepted = transfers.filter((t) => t.status === TransferStatus.Accepted).length;
  const rejected = transfers.filter((t) => t.status === TransferStatus.Rejected).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transferencias</h1>
          <p className="mt-2 text-gray-600">
            Gestiona las transferencias de tokens enviadas y recibidas
          </p>
        </div>

        {/* Estadísticas */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingReceived}</div>
                <div className="text-sm text-gray-600 mt-1">Pendientes Recibidas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pendingSent}</div>
                <div className="text-sm text-gray-600 mt-1">Pendientes Enviadas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{accepted}</div>
                <div className="text-sm text-gray-600 mt-1">Aceptadas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{rejected}</div>
                <div className="text-sm text-gray-600 mt-1">Rechazadas</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* Alertas de pendientes */}
        {pendingReceived > 0 && (
          <div className="mb-6">
            <Alert variant="info">
              Tienes {pendingReceived} transferencia(s) pendiente(s) de aceptar o rechazar
            </Alert>
          </div>
        )}

        {/* Lista de transferencias */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Transferencias ({transfers.length})</CardTitle>
          </CardHeader>
          <CardContent padding={false}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando transferencias...</span>
              </div>
            ) : (
              <TransferList
                transfers={transfers}
                currentUserAddress={account || ""}
                onAccept={handleAccept}
                onReject={handleReject}
                loading={actionLoading}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}