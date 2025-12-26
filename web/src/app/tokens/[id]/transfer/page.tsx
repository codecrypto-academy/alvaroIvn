"use client";

/**
 * Transfer Token Page
 * Formulario para crear una transferencia de tokens
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { getToken, getTokenBalance, transferToken, getUserTransfers, getTransfer } from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { isValidAddress } from "@/lib/web3";
import { TransferStatus } from "@/contracts/config";
import type { Token } from "@/types";

interface TransferTokenPageProps {
  params: { id: string };
}

export default function TransferTokenPage({ params }: TransferTokenPageProps) {
  const router = useRouter();
  const { account, signer, isConnected, isAdmin, userRole } = useWallet();
  const tokenId = parseInt(params.id);

  const [token, setToken] = useState<Token | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    to: "",
    amount: "",
  });

  // Cargar datos del token y calcular balance disponible
  useEffect(() => {
    if (tokenId && account) {
      setLoadingData(true);
      Promise.all([
        getToken(tokenId),
        getTokenBalance(tokenId, account),
        getUserTransfers(account)
      ])
        .then(async ([tokenData, tokenBalance, transferIds]) => {
          setToken(tokenData);
          setBalance(tokenBalance);

          // Calcular tokens en transferencias pendientes salientes para este token específico
          const transfers = await Promise.all(transferIds.map(id => getTransfer(id)));
          const pendingOutgoing = transfers
            .filter(t =>
              t.tokenId === tokenId &&
              t.from.toLowerCase() === account.toLowerCase() &&
              t.status === TransferStatus.Pending
            )
            .reduce((sum, t) => sum + t.amount, 0);

          setPendingAmount(pendingOutgoing);
          setAvailableBalance(tokenBalance - pendingOutgoing);
        })
        .catch((err) => {
          setError(err.message || "Error al cargar token");
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [tokenId, account]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signer || !tokenId) {
      setError("Datos incompletos");
      return;
    }

    // Validaciones
    if (!isValidAddress(formData.to)) {
      setError("Dirección de destino inválida");
      return;
    }

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (amount > availableBalance) {
      setError(`No tienes suficiente balance disponible. Balance disponible: ${availableBalance} (${pendingAmount} en transferencias pendientes)`);
      return;
    }

    if (formData.to.toLowerCase() === account?.toLowerCase()) {
      setError("No puedes transferir a ti mismo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await transferToken(signer, formData.to, tokenId, amount);

      // Redirigir a transferencias
      router.push("/transfers");
    } catch (err: any) {
      setError(err.message || "Error al crear transferencia");
      setLoading(false);
    }
  };

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

  // Bloquear acceso para administradores y consumidores
  if (isAdmin || userRole === "CONSUMER") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="error">
            {isAdmin
              ? "Los administradores no pueden transferir tokens. Solo pueden visualizar."
              : "Los consumidores son el punto final de la cadena y no pueden transferir tokens."}
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/tokens")} variant="secondary">
              Volver a Mis Tokens
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando...</span>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="error">Token no encontrado</Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transferir Token</h1>
          <p className="mt-2 text-gray-600">
            Envía tokens a otro usuario en la cadena de suministro
          </p>
        </div>

        {/* Info del token */}
        <Card className="mb-6">
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Token</div>
                <div className="text-lg font-semibold text-gray-900">{token.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Balance Total</div>
                <div className="text-lg font-semibold text-gray-900">
                  {balance.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Balance Disponible</div>
                <div className="text-lg font-semibold text-primary-600">
                  {availableBalance.toLocaleString()}
                </div>
                {pendingAmount > 0 && (
                  <div className="text-xs text-yellow-600 mt-1">
                    {pendingAmount.toLocaleString()} en transferencias pendientes
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {availableBalance === 0 && (
          <Alert variant="warning" className="mb-6">
            {balance > 0
              ? `No tienes balance disponible. Tienes ${pendingAmount.toLocaleString()} tokens en transferencias pendientes.`
              : "No tienes balance de este token para transferir"}
          </Alert>
        )}

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Transferencia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Dirección de Destino"
                name="to"
                value={formData.to}
                onChange={handleChange}
                placeholder="0x..."
                required
                disabled={availableBalance === 0}
              />

              <Input
                label="Cantidad a Transferir"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Ej: 100"
                required
                min="1"
                max={availableBalance}
                disabled={availableBalance === 0}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> La transferencia quedará en estado &quot;Pendiente&quot; hasta que el
                  receptor la acepte o rechace.
                </p>
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={availableBalance === 0}
                  className="flex-1"
                >
                  Crear Transferencia
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(`/tokens/${tokenId}`)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}