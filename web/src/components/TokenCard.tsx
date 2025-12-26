"use client";

/**
 * TokenCard Component
 * Tarjeta para mostrar información de un token
 */

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Token } from "@/types";
import { formatDate, parseFeatures } from "@/lib/web3";

interface TokenCardProps {
  token: Token & { pendingTransfers?: number };
  balance?: number;
  showActions?: boolean;
  isAdmin?: boolean;
  userRole?: string;
  userAccount?: string;
}

export function TokenCard({ token, balance, showActions = true, isAdmin = false, userRole, userAccount }: TokenCardProps) {
  const features = parseFeatures(token.features);
  const pendingTransfers = token.pendingTransfers || 0;
  const totalBalance = balance !== undefined ? balance : 0;
  const availableBalance = totalBalance - pendingTransfers;

  // Verificar si el usuario actual es el creador del token
  const isCreator = userAccount?.toLowerCase() === token.creator.toLowerCase();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>
            {token.name}
            {token.parentId > 0 && (
              <Badge variant="info" className="ml-2">
                Derivado de #{token.parentId}
              </Badge>
            )}
          </CardTitle>
          <Badge variant="default">ID: {token.id}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">Balance Total</div>
            <div className="text-lg font-semibold text-gray-900">{token.totalSupply.toLocaleString()}</div>
          </div>

          {balance !== undefined && (
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
          )}

          <div>
            <div className="text-sm text-gray-600">Creador</div>
            <div className="text-sm font-mono text-gray-900">{token.creator.slice(0, 12)}...</div>
          </div>

          <div>
            <div className="text-sm text-gray-600">Fecha de Creación</div>
            <div className="text-sm text-gray-900">{formatDate(token.dateCreated)}</div>
          </div>

          {Object.keys(features).length > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-2">Características</div>
              <div className="bg-gray-50 rounded p-2">
                <pre className="text-xs overflow-x-auto text-gray-900">
                  {JSON.stringify(features, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {showActions && (
            <div className="pt-3 space-y-2">
              <Link href={`/tokens/${token.id}`} className="block">
                <Button variant="secondary" size="sm" className="w-full">
                  Ver Detalles
                </Button>
              </Link>
              {/* Solo mostrar botón de transferir si NO es admin, NO es CONSUMER, tiene balance disponible Y es el creador */}
              {!isAdmin && userRole !== "CONSUMER" && availableBalance > 0 && isCreator && (
                <Link href={`/tokens/${token.id}/transfer`} className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    Transferir
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}