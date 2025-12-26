"use client";

/**
 * UserTable Component
 * Tabla para listar y gestionar usuarios (panel de administración)
 */

import React from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { User } from "@/types";
import { USER_STATUS_LABELS, UserStatus } from "@/contracts/config";

interface UserTableProps {
  users: User[];
  onApprove: (address: string) => void;
  onReject: (address: string) => void;
  onCancel: (address: string) => void;
  loading?: boolean;
  adminAddress: string;
}

export function UserTable({ users, onApprove, onReject, onCancel, loading, adminAddress }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay usuarios registrados
      </div>
    );
  }

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Approved:
        return "success";
      case UserStatus.Pending:
        return "warning";
      case UserStatus.Rejected:
        return "danger";
      case UserStatus.Canceled:
        return "default";
      default:
        return "default";
    }
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
              Dirección
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                #{user.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {user.userAddress.slice(0, 10)}...{user.userAddress.slice(-8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.role}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {USER_STATUS_LABELS[user.status]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {/* Si es el admin, no mostrar botones de acción */}
                {user.userAddress.toLowerCase() === adminAddress.toLowerCase() ? (
                  <span className="text-gray-400 text-xs italic">Admin principal</span>
                ) : (
                  <>
                    {/* Pending: Aprobar o Rechazar */}
                    {user.status === UserStatus.Pending && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => onApprove(user.userAddress)}
                          disabled={loading}
                          className="w-24"
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onReject(user.userAddress)}
                          disabled={loading}
                          className="w-24"
                        >
                          Rechazar
                        </Button>
                      </>
                    )}

                    {/* Approved: Cancelar/Deshabilitar */}
                    {user.status === UserStatus.Approved && (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => onCancel(user.userAddress)}
                        disabled={loading}
                        className="w-24"
                      >
                        Deshabilitar
                      </Button>
                    )}

                    {/* Rejected: Aprobar o Cancelar definitivamente */}
                    {user.status === UserStatus.Rejected && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => onApprove(user.userAddress)}
                          disabled={loading}
                          className="w-24"
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onCancel(user.userAddress)}
                          disabled={loading}
                          className="w-24"
                        >
                          Cancelar
                        </Button>
                      </>
                    )}

                    {/* Canceled: Reactivar (Aprobar) */}
                    {user.status === UserStatus.Canceled && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onApprove(user.userAddress)}
                        disabled={loading}
                        className="w-24"
                      >
                        Reactivar
                      </Button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}