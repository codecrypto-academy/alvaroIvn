"use client";

/**
 * Token Detail Page
 * Muestra los detalles completos de un token
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { getToken, getTokenBalance, getTokenTransfers, getUserTransfers, getTransfer } from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { formatDate, parseFeatures } from "@/lib/web3";
import { TRANSFER_STATUS_LABELS, TransferStatus } from "@/contracts/config";
import type { Token, Transfer } from "@/types";

interface TokenDetailPageProps {
  params: { id: string };
}

export default function TokenDetailPage({ params }: TokenDetailPageProps) {
  const { account, isConnected, isAdmin, userRole } = useWallet();
  const tokenId = parseInt(params.id);

  const [token, setToken] = useState<Token | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [pendingTransfers, setPendingTransfers] = useState<number>(0);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del token
  useEffect(() => {
    if (tokenId && account) {
      setLoading(true);
      Promise.all([
        getToken(tokenId),
        getTokenBalance(tokenId, account),
        getTokenTransfers(tokenId),
        getUserTransfers(account)
      ])
        .then(async ([tokenData, tokenBalance, tokenTransfers, userTransferIds]) => {
          setToken(tokenData);
          setBalance(tokenBalance);
          setTransfers(tokenTransfers);

          // Calcular transferencias pendientes enviadas para este token
          const userTransfers = await Promise.all(
            userTransferIds.map((id) => getTransfer(id))
          );

          const pending = userTransfers
            .filter(
              (t) =>
                t.tokenId === tokenId &&
                t.from.toLowerCase() === account.toLowerCase() &&
                t.status === TransferStatus.Pending
            )
            .reduce((sum, t) => sum + t.amount, 0);

          setPendingTransfers(pending);
        })
        .catch((err) => {
          setError(err.message || "Error al cargar token");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [tokenId, account]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="warning">Debes conectar tu wallet</Alert>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando token...</span>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="error">{error || "Token no encontrado"}</Alert>
        </main>
      </div>
    );
  }

  const features = parseFeatures(token.features);
  const availableBalance = balance - pendingTransfers;

  // Verificar si el usuario actual es el creador del token
  const isCreator = account?.toLowerCase() === token.creator.toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{token.name}</h1>
            <p className="mt-2 text-gray-600">Token ID: #{token.id}</p>
          </div>
          {!isAdmin && userRole !== "CONSUMER" && availableBalance > 0 && isCreator && (
            <Link href={`/tokens/${token.id}/transfer`}>
              <Button>Transferir</Button>
            </Link>
          )}
        </div>

        {/* Mensaje informativo si el usuario tiene balance pero no es el creador */}
        {!isAdmin && userRole !== "CONSUMER" && balance > 0 && !isCreator && (
          <Alert variant="info" className="mb-6">
            <div>
              <strong>Información sobre transferencias:</strong> Solo puedes transferir tokens que tú hayas creado.
              Este token fue creado por otra dirección, por lo que debes crear un nuevo token derivado de este
              para poder transferirlo al siguiente eslabón de la cadena.
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Balance Total</div>
                <div className="text-2xl font-bold text-gray-900">
                  {token.totalSupply.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Balance Disponible</div>
                <div className="text-2xl font-bold text-blue-600">
                  {availableBalance.toLocaleString()}
                </div>
                {pendingTransfers > 0 && (
                  <div className="text-sm text-orange-600 mt-1">
                    {pendingTransfers.toLocaleString()} en transferencias pendientes
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Creador</div>
                {/* Versión móvil - dirección acortada */}
                <div className="sm:hidden text-sm font-mono bg-gray-50 p-2 rounded text-gray-900 break-all">
                  {token.creator.slice(0, 10)}...{token.creator.slice(-8)}
                </div>
                {/* Versión desktop - dirección completa */}
                <div className="hidden sm:block text-sm font-mono bg-gray-50 p-2 rounded text-gray-900 break-all">
                  {token.creator}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Fecha de Creación</div>
                <div className="text-sm text-gray-900">{formatDate(token.dateCreated)}</div>
              </div>

              {token.parentId > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Trazabilidad</div>
                  <Link href={`/tokens/${token.parentId}`}>
                    <Badge variant="info">
                      Derivado del Token #{token.parentId}
                    </Badge>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(features).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(features).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-100 pb-2">
                      <div className="text-sm font-medium text-gray-700 capitalize">
                        {key}
                      </div>
                      <div className="text-sm text-gray-900">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Sin características definidas
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historial de Transferencias (Trazabilidad) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Historial de Transferencias</CardTitle>
          </CardHeader>
          <CardContent>
            {transfers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Este token no tiene transferencias aún
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Desde
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hacia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transfers.map((transfer) => (
                      <tr key={transfer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {transfer.from.slice(0, 10)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {transfer.to.slice(0, 10)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {transfer.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              transfer.status === TransferStatus.Accepted
                                ? "success"
                                : transfer.status === TransferStatus.Pending
                                ? "warning"
                                : "danger"
                            }
                          >
                            {TRANSFER_STATUS_LABELS[transfer.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transfer.dateCreated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="mt-8 flex gap-3">
          <Link href={isAdmin ? "/admin/tokens" : "/tokens"} className="flex-1">
            <Button variant="secondary" className="w-full">
              {isAdmin ? "Volver a Tokens del Sistema" : "Volver a Mis Tokens"}
            </Button>
          </Link>
          {!isAdmin && userRole !== "CONSUMER" && availableBalance > 0 && isCreator && (
            <Link href={`/tokens/${token.id}/transfer`} className="flex-1">
              <Button className="w-full">Transferir Tokens</Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}