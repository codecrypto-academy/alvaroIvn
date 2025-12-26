/**
 * useWallet - Hook simplificado para acceder a la funcionalidad de wallet
 *
 * Expone:
 * - account: dirección conectada
 * - isConnected: si hay wallet conectada
 * - chainId: ID de la red actual
 * - isCorrectNetwork: si está en Anvil (31337)
 * - connect/disconnect: funciones de conexión
 * - provider/signer: instancias de ethers
 * - error: mensajes de error
 * - userRole: rol del usuario (PRODUCER, FACTORY, etc.)
 * - isRegistered: si el usuario está registrado en el sistema
 * - isCheckingRegistration: si está verificando el registro del usuario
 */

import { useWeb3Context } from "@/contexts/Web3Context";
import { CONTRACT_CONFIG } from "@/contracts/config";
import { useEffect, useState } from "react";
import { getUserInfo } from "@/lib/web3";

export function useWallet() {
  const context = useWeb3Context();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);

  // Helpers adicionales
  const isAdmin = context.account?.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase();
  const isRegistered = userRole !== null;

  // Cargar rol del usuario
  useEffect(() => {
    if (context.account) {
      setIsCheckingRegistration(true);
      getUserInfo(context.account)
        .then((user) => {
          if (user && user.id > 0) {
            setUserRole(user.role);
          } else {
            setUserRole(null);
          }
        })
        .catch(() => {
          setUserRole(null);
        })
        .finally(() => {
          setIsCheckingRegistration(false);
        });
    } else {
      setUserRole(null);
      setIsCheckingRegistration(false);
    }
  }, [context.account]);

  // Formatear dirección (0x123...789)
  const formatAddress = (address: string | null): string => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    // Estado básico
    account: context.account,
    isConnected: context.isConnected,
    chainId: context.chainId,
    isCorrectNetwork: context.isCorrectNetwork,
    error: context.error,

    // Ethers instances
    provider: context.provider,
    signer: context.signer,

    // Acciones
    connect: context.connect,
    disconnect: context.disconnect,

    // Helpers
    isAdmin,
    userRole,
    isRegistered,
    isCheckingRegistration,
    formatAddress,
    formattedAccount: formatAddress(context.account),
  };
}