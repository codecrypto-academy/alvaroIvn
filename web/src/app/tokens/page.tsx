"use client";

/**
 * Tokens Page
 * Lista todos los tokens del usuario conectado
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { getUserTokens, getToken, getTokenBalance, getUserTransfers, getTransfer } from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TokenCard } from "@/components/TokenCard";
import { TokenWithBalance } from "@/types";
import { TransferStatus } from "@/contracts/config";

export default function TokensPage() {
  const router = useRouter();
  const { account, isConnected, isAdmin, userRole } = useWallet();

  const [tokens, setTokens] = useState<TokenWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar si el usuario puede crear tokens
  const canCreateTokens = !isAdmin && userRole !== "CONSUMER";

  // Cargar tokens del usuario
  const loadTokens = async () => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      // Obtener IDs de tokens del usuario
      const tokenIds = await getUserTokens(account);

      // Obtener las transferencias del usuario para calcular pendientes
      const transferIds = await getUserTransfers(account);
      const transfers = await Promise.all(transferIds.map((id) => getTransfer(id)));

      // Cargar información de cada token
      const tokensData = await Promise.all(
        tokenIds.map(async (id) => {
          const token = await getToken(id);
          const balance = await getTokenBalance(id, account);

          // Calcular cantidad en transferencias pendientes enviadas para este token
          const pendingTransfers = transfers
            .filter(
              (t) =>
                t.tokenId === id &&
                t.from.toLowerCase() === account.toLowerCase() &&
                t.status === TransferStatus.Pending
            )
            .reduce((sum, t) => sum + t.amount, 0);

          return { ...token, balance, pendingTransfers };
        })
      );

      setTokens(tokensData);
    } catch (err: any) {
      setError(err.message || "Error al cargar tokens");
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
      loadTokens();
    }
  }, [isConnected, account, router]);

  if (!isConnected) {
    return null; // Redirigiendo...
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? "Ver Tokens" : "Mis Tokens"}
            </h1>
            <p className="mt-2 text-gray-600">
              {isAdmin
                ? "Visualiza los tokens del sistema para supervisión"
                : "Gestiona tus tokens y transferencias"}
            </p>
          </div>
          {canCreateTokens && (
            <Link href="/tokens/create">
              <Button>+ Crear Token</Button>
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando tokens...</span>
              </div>
            </CardContent>
          </Card>
        ) : tokens.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isAdmin ? "Sin tokens asociados" : "No tienes tokens aún"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isAdmin
                    ? "No hay tokens asociados a esta cuenta de administrador"
                    : canCreateTokens
                    ? "Crea tu primer token para empezar a usarlo en la cadena de suministro"
                    : "Aún no has recibido ningún token"}
                </p>
                {canCreateTokens && (
                  <Link href="/tokens/create">
                    <Button>Crear Token</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <TokenCard key={token.id} token={token} balance={token.balance} isAdmin={isAdmin} userRole={userRole || undefined} userAccount={account || undefined} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}