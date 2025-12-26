"use client";

/**
 * TransferList Component
 * Lista de transferencias con acciones
 */

import React from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Transfer } from "@/types";
import { TRANSFER_STATUS_LABELS, TransferStatus } from "@/contracts/config";
import { formatDate } from "@/lib/web3";

interface TransferListProps {
  transfers: Transfer[];
  currentUserAddress: string;
  onAccept?: (transferId: number) => void;
  onReject?: (transferId: number) => void;
  loading?: boolean;
}

export function TransferList({
  transfers,
  currentUserAddress,
  onAccept,
  onReject,
  loading,
}: TransferListProps) {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay transferencias
      </div>
    );
  }

  const getStatusBadgeVariant = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.Accepted:
        return "success";
      case TransferStatus.Pending:
        return "warning";
      case TransferStatus.Rejected:
        return "danger";
      default:
        return "default";
    }
  };

  const isReceiver = (transfer: Transfer) => {
    return transfer.to.toLowerCase() === currentUserAddress.toLowerCase();
  };

  const isSender = (transfer: Transfer) => {
    return transfer.from.toLowerCase() === currentUserAddress.toLowerCase();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              De
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Para
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Token ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cantidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transfers.map((transfer) => (
            <tr
              key={transfer.id}
              className={`hover:bg-gray-50 ${
                isReceiver(transfer) ? "bg-blue-50" : ""
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                #{transfer.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {isSender(transfer) && <Badge variant="info" className="mr-2">Tú</Badge>}
                {transfer.from.slice(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {isReceiver(transfer) && <Badge variant="info" className="mr-2">Tú</Badge>}
                {transfer.to.slice(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                #{transfer.tokenId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {transfer.amount.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(transfer.status)}>
                  {TRANSFER_STATUS_LABELS[transfer.status]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(transfer.dateCreated)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {isReceiver(transfer) && transfer.status === TransferStatus.Pending && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => onAccept && onAccept(transfer.id)}
                      disabled={loading}
                    >
                      Aceptar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onReject && onReject(transfer.id)}
                      disabled={loading}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
                {!isReceiver(transfer) && transfer.status === TransferStatus.Pending && (
                  <span className="text-gray-400 text-xs">Esperando aprobación</span>
                )}
                {transfer.status !== TransferStatus.Pending && (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}