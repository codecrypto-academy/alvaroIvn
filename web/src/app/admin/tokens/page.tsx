"use client";

/**
 * Admin Tokens Page
 * Panel de administración para ver todos los tokens del sistema
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { getAllTokens } from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { formatDate, parseFeatures } from "@/lib/web3";
import type { Token } from "@/types";

export default function AdminTokensPage() {
  const router = useRouter();
  const { isConnected, isAdmin } = useWallet();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los tokens
  const loadAllTokens = async () => {
    setLoading(true);
    setError(null);

    try {
      const allTokens = await getAllTokens();
      setTokens(allTokens);
    } catch (err: any) {
      setError(err.message || "Error al cargar tokens");
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
      loadAllTokens();
    }
  }, [isConnected, isAdmin, router]);

  // Mostrar solo si está conectado y es admin
  if (!isConnected || !isAdmin) {
    return null; // Redirigiendo...
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Todos los Tokens</h1>
          <p className="mt-2 text-gray-600">
            Vista completa de todos los tokens en el sistema
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Tokens Registrados ({tokens.length})</CardTitle>
          </CardHeader>
          <CardContent padding={false}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando tokens...</span>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay tokens registrados en el sistema
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Creador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Supply
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Parent ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tokens.map((token) => {
                      const features = parseFeatures(token.features);
                      return (
                        <tr key={token.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{token.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {token.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {token.creator.slice(0, 10)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {token.totalSupply.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {token.parentId > 0 ? (
                              <Link href={`/tokens/${token.parentId}`}>
                                <Badge variant="info">#{token.parentId}</Badge>
                              </Link>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(token.dateCreated)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Link href={`/tokens/${token.id}`}>
                              <Badge variant="default" className="cursor-pointer hover:bg-gray-300">
                                Ver Trazabilidad
                              </Badge>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
