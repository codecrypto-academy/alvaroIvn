"use client";

/**
 * Profile Page
 * Información del perfil del usuario
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { getUserInfo, getUserTokens, getToken } from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { USER_STATUS_LABELS, UserStatus } from "@/contracts/config";
import type { User, Token } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { account, isConnected, isAdmin } = useWallet();

  const [user, setUser] = useState<User | null>(null);
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }
    if (account) {
      loadProfile();
    }
  }, [account, isConnected, router, isAdmin]);

  const loadProfile = async () => {
    if (!account) return;

    setLoading(true);

    try {
      // Cargar información del usuario
      const userInfo = await getUserInfo(account);

      // Si el usuario no existe, redirigir al home
      if (!userInfo) {
        router.push("/");
        return;
      }

      setUser(userInfo);

      // Solo cargar tokens si NO es admin
      if (!isAdmin) {
        const tokenIds = await getUserTokens(account);
        const lastFiveIds = tokenIds.slice(-5).reverse();
        const tokensData = await Promise.all(lastFiveIds.map((id) => getToken(id)));
        setRecentTokens(tokensData);
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return null; // Redirigiendo...
  }

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Approved:
        return "success";
      case UserStatus.Pending:
        return "warning";
      case UserStatus.Rejected:
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-2 text-gray-600">
            Información de tu cuenta en la cadena de suministro
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Cargando perfil...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Información del usuario */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Información de la Cuenta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">ID de Usuario</div>
                    <div className="text-lg font-semibold text-gray-900">#{user?.id}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Dirección de Wallet</div>
                    <div className="text-sm font-mono bg-gray-50 p-3 rounded break-all text-gray-900">
                      {account}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Rol en la Cadena</div>
                    <Badge variant={isAdmin ? "success" : "info"} className="text-base px-4 py-1">
                      {user?.role}
                    </Badge>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Estado de la Cuenta</div>
                    <Badge
                      variant={getStatusBadgeVariant(user?.status || UserStatus.Pending)}
                      className="text-base px-4 py-1"
                    >
                      {user ? USER_STATUS_LABELS[user.status] : "-"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tokens recientes - Solo para usuarios no admin */}
            {!isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Tokens Recientes</CardTitle>
                    <Link href="/tokens">
                      <Button variant="secondary" size="sm">
                        Ver Todos
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentTokens.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No tienes tokens aún
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTokens.map((token) => (
                        <Link key={token.id} href={`/tokens/${token.id}`}>
                          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold text-gray-900">{token.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Supply: {token.totalSupply.toLocaleString()}
                                </div>
                              </div>
                              <Badge variant="default">#{token.id}</Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Acciones rápidas */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full">
                  Ir al Dashboard
                </Button>
              </Link>
              {isAdmin ? (
                <Link href="/admin/users">
                  <Button className="w-full">Gestión de Usuarios</Button>
                </Link>
              ) : (
                <Link href="/tokens">
                  <Button className="w-full">Ver Mis Tokens</Button>
                </Link>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}