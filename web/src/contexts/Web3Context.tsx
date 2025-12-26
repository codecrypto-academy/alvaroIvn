"use client";

/**
 * Web3Context - Gestión global del estado de conexión Web3
 *
 * Funcionalidades:
 * - Conexión/desconexión con MetaMask
 * - Persistencia de sesión en localStorage
 * - Manejo de eventos accountsChanged y chainChanged
 * - Validación de red correcta (Anvil chainId 31337)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { NETWORK_CONFIG } from "@/contracts/config";
import { resetContract } from "@/lib/web3";

// Tipos para el contexto
interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

// Crear el contexto
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Provider del contexto
export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado derivado
  const isConnected = account !== null;
  const isCorrectNetwork = chainId === NETWORK_CONFIG.chainId;

  /**
   * Conectar a MetaMask
   */
  const connect = async () => {
    try {
      setError(null);

      // Verificar que window.ethereum existe (solo en cliente)
      if (typeof window === "undefined" || !window.ethereum) {
        setError("MetaMask no está instalado. Por favor, instala MetaMask para continuar.");
        return;
      }

      // Crear provider de ethers
      const browserProvider = new BrowserProvider(window.ethereum);

      // Solicitar acceso a las cuentas
      const accounts = await browserProvider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        setError("No se pudo obtener ninguna cuenta de MetaMask");
        return;
      }

      // Obtener el signer y chainId
      const ethSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Actualizar estado
      setAccount(accounts[0]);
      setChainId(currentChainId);
      setProvider(browserProvider);
      setSigner(ethSigner);

      // Guardar en localStorage para persistencia
      if (typeof window !== "undefined") {
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletAddress", accounts[0]);
      }

      // Advertencia si no está en la red correcta
      if (currentChainId !== NETWORK_CONFIG.chainId) {
        setError(
          `Red incorrecta. Por favor, cambia a ${NETWORK_CONFIG.name} (chainId: ${NETWORK_CONFIG.chainId})`
        );
      }
    } catch (err: any) {
      console.error("Error al conectar:", err);
      setError(err.message || "Error al conectar con MetaMask");
    }
  };

  /**
   * Desconectar wallet
   */
  const disconnect = () => {
    // Limpiar la instancia del contrato
    resetContract();

    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);

    // Limpiar localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("walletAddress");
    }
  };

  /**
   * Rehidratar sesión desde localStorage al cargar
   */
  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === "undefined") return;

    const wasConnected = localStorage.getItem("walletConnected");
    if (wasConnected === "true") {
      // Intentar reconectar automáticamente
      connect();
    }
  }, []); // Solo al montar el componente

  /**
   * Suscribirse a eventos de MetaMask
   */
  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === "undefined" || !window.ethereum) return;

    // Evento: cambio de cuenta
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // Usuario desconectó la wallet desde MetaMask
        disconnect();
      } else if (accounts[0] !== account) {
        // Cambió a otra cuenta - necesitamos actualizar el provider y signer también
        try {
          if (!window.ethereum) {
            setError("MetaMask no está disponible");
            return;
          }

          // Limpiar la instancia del contrato anterior
          resetContract();

          const browserProvider = new BrowserProvider(window.ethereum);
          const ethSigner = await browserProvider.getSigner();
          const network = await browserProvider.getNetwork();
          const currentChainId = Number(network.chainId);

          setAccount(accounts[0]);
          setProvider(browserProvider);
          setSigner(ethSigner);
          setChainId(currentChainId);

          if (typeof window !== "undefined") {
            localStorage.setItem("walletAddress", accounts[0]);
          }

          // Verificar si está en la red correcta
          if (currentChainId !== NETWORK_CONFIG.chainId) {
            setError(
              `Red incorrecta. Por favor, cambia a ${NETWORK_CONFIG.name} (chainId: ${NETWORK_CONFIG.chainId})`
            );
          } else {
            setError(null);
          }

          // Nota: La verificación de si el usuario está registrado se hace
          // en useWallet hook, no es necesario duplicarla aquí
        } catch (err) {
          console.error("Error al actualizar cuenta:", err);
          setError("Error al cambiar de cuenta");
        }
      }
    };

    // Evento: cambio de red
    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);

      // Verificar si es la red correcta
      if (newChainId !== NETWORK_CONFIG.chainId) {
        setError(
          `Red incorrecta. Por favor, cambia a ${NETWORK_CONFIG.name} (chainId: ${NETWORK_CONFIG.chainId})`
        );
      } else {
        setError(null);
      }

      // MetaMask recomienda recargar la página al cambiar de red
      window.location.reload();
    };

    // Suscribirse a eventos
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Cleanup: desuscribirse al desmontar
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [account]);

  const value: Web3ContextType = {
    account,
    isConnected,
    chainId,
    provider,
    signer,
    isCorrectNetwork,
    connect,
    disconnect,
    error,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

/**
 * Hook para usar el Web3Context
 */
export function useWeb3Context() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3Context debe usarse dentro de un Web3Provider");
  }
  return context;
}