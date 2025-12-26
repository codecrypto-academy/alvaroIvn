/**
 * Web3 Service Layer
 *
 * Capa de servicios que envuelve ethers.js y proporciona funciones
 * de alto nivel para interactuar con el contrato SupplyChain.
 *
 * Funciones principales:
 * - getUserInfo, requestUserRole, changeStatusUser
 * - getToken, getUserTokens, createToken, getTokenBalance
 * - getTransfer, getUserTransfers, transferToken, acceptTransfer, rejectTransfer
 */

import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import { CONTRACT_CONFIG, UserStatus, TransferStatus } from "@/contracts/config";
import { User, Token, Transfer } from "@/types";

// Instancia global del contrato (read-only, sin signer)
let contractInstance: Contract | null = null;

/**
 * Limpiar la instancia del contrato (útil cuando cambia la cuenta)
 */
export function resetContract(): void {
  contractInstance = null;
}

/**
 * Obtener instancia del contrato para lectura (no requiere signer)
 */
function getContract(): Contract {
  if (!contractInstance && typeof window !== "undefined" && window.ethereum) {
    // Crear provider read-only usando RPC directo
    const provider = new BrowserProvider(window.ethereum);
    contractInstance = new Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_CONFIG.abi,
      provider
    );
  }
  if (!contractInstance) {
    throw new Error("No se pudo inicializar el contrato. MetaMask no está disponible.");
  }
  return contractInstance;
}

/**
 * Obtener instancia del contrato con signer (para escritura)
 */
function getContractWithSigner(signer: JsonRpcSigner): Contract {
  return new Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
}

// ========== FUNCIONES DE USUARIOS ==========

/**
 * Obtener información de un usuario
 * @returns User info o null si el usuario no existe
 */
export async function getUserInfo(address: string): Promise<User | null> {
  try {
    const contract = getContract();
    const userTuple = await contract.getUserInfo(address);

    return {
      id: Number(userTuple[0]),
      userAddress: userTuple[1],
      role: userTuple[2],
      status: Number(userTuple[3]) as UserStatus,
    };
  } catch (error: any) {
    // Si el usuario no existe, retornar null en lugar de lanzar error
    if (error?.reason === "User not found" || error?.message?.includes("User not found")) {
      return null;
    }
    // Para otros errores, sí registrar y lanzar
    console.error("Error al obtener info del usuario:", error);
    throw error;
  }
}

/**
 * Solicitar registro con un rol
 */
export async function requestUserRole(signer: JsonRpcSigner, role: string): Promise<void> {
  try {
    const contract = getContractWithSigner(signer);
    const tx = await contract.requestUserRole(role);
    await tx.wait(); // Esperar confirmación
  } catch (error: any) {
    console.error("Error al solicitar rol:", error);
    throw new Error(error.reason || error.message || "Error al solicitar rol");
  }
}

/**
 * Cambiar status de un usuario (solo admin)
 */
export async function changeStatusUser(
  signer: JsonRpcSigner,
  userAddress: string,
  newStatus: UserStatus
): Promise<void> {
  try {
    const contract = getContractWithSigner(signer);
    const tx = await contract.changeStatusUser(userAddress, newStatus);
    await tx.wait();
  } catch (error: any) {
    console.error("Error al cambiar status:", error);
    throw new Error(error.reason || error.message || "Error al cambiar status");
  }
}

/**
 * Verificar si una dirección es admin
 */
export async function isAdmin(address: string): Promise<boolean> {
  try {
    const contract = getContract();
    return await contract.isAdmin(address);
  } catch (error) {
    console.error("Error al verificar admin:", error);
    return false;
  }
}

/**
 * Obtener todos los usuarios registrados (para admin)
 * Nota: Esta función itera desde userId 1 hasta nextUserId
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const contract = getContract();
    const nextUserId = await contract.nextUserId();
    const users: User[] = [];

    // Iterar desde 1 hasta nextUserId - 1
    for (let i = 1; i < Number(nextUserId); i++) {
      try {
        const userTuple = await contract.users(i);
        users.push({
          id: Number(userTuple[0]),
          userAddress: userTuple[1],
          role: userTuple[2],
          status: Number(userTuple[3]) as UserStatus,
        });
      } catch (err) {
        // Si un userId no existe, continuar
        console.warn(`Usuario con ID ${i} no encontrado`);
      }
    }

    return users;
  } catch (error) {
    console.error("Error al obtener todos los usuarios:", error);
    throw error;
  }
}

// ========== FUNCIONES DE TOKENS ==========

/**
 * Obtener información de un token
 */
export async function getToken(tokenId: number): Promise<Token> {
  try {
    const contract = getContract();
    const tokenTuple = await contract.getToken(tokenId);

    return {
      id: Number(tokenTuple[0]),
      creator: tokenTuple[1],
      name: tokenTuple[2],
      totalSupply: Number(tokenTuple[3]),
      features: tokenTuple[4],
      parentId: Number(tokenTuple[5]),
      dateCreated: Number(tokenTuple[6]),
    };
  } catch (error) {
    console.error("Error al obtener token:", error);
    throw error;
  }
}

/**
 * Obtener balance de un token para un usuario
 */
export async function getTokenBalance(tokenId: number, userAddress: string): Promise<number> {
  try {
    const contract = getContract();
    const balance = await contract.getTokenBalance(tokenId, userAddress);
    return Number(balance);
  } catch (error) {
    console.error("Error al obtener balance:", error);
    return 0;
  }
}

/**
 * Obtener IDs de tokens de un usuario
 */
export async function getUserTokens(address: string): Promise<number[]> {
  try {
    const contract = getContract();
    const tokenIds = await contract.getUserTokens(address);
    return tokenIds.map((id: bigint) => Number(id));
  } catch (error) {
    console.error("Error al obtener tokens del usuario:", error);
    return [];
  }
}

/**
 * Obtener todos los tokens del sistema (para administradores)
 */
export async function getAllTokens(): Promise<Token[]> {
  try {
    const contract = getContract();
    const nextTokenId = await contract.nextTokenId();
    const tokens: Token[] = [];

    // Iterar desde 1 hasta nextTokenId - 1
    for (let i = 1; i < Number(nextTokenId); i++) {
      try {
        const token = await getToken(i);
        tokens.push(token);
      } catch (error) {
        console.error(`Error al obtener token ${i}:`, error);
      }
    }

    return tokens;
  } catch (error) {
    console.error("Error al obtener todos los tokens:", error);
    return [];
  }
}

/**
 * Crear un nuevo token
 */
export async function createToken(
  signer: JsonRpcSigner,
  name: string,
  totalSupply: number,
  features: string,
  parentId: number = 0,
  amountConsumed: number = 0
): Promise<void> {
  try {
    const contract = getContractWithSigner(signer);
    const tx = await contract.createToken(name, totalSupply, features, parentId, amountConsumed);
    await tx.wait();
  } catch (error: any) {
    console.error("Error al crear token:", error);
    throw new Error(error.reason || error.message || "Error al crear token");
  }
}

// ========== FUNCIONES DE TRANSFERENCIAS ==========

/**
 * Obtener información de una transferencia
 */
export async function getTransfer(transferId: number): Promise<Transfer> {
  try {
    const contract = getContract();
    const transferTuple = await contract.getTransfer(transferId);

    return {
      id: Number(transferTuple[0]),
      from: transferTuple[1],
      to: transferTuple[2],
      tokenId: Number(transferTuple[3]),
      dateCreated: Number(transferTuple[4]),
      amount: Number(transferTuple[5]),
      status: Number(transferTuple[6]) as TransferStatus,
    };
  } catch (error) {
    console.error("Error al obtener transferencia:", error);
    throw error;
  }
}

/**
 * Obtener IDs de transferencias de un usuario
 */
export async function getUserTransfers(address: string): Promise<number[]> {
  try {
    const contract = getContract();
    const transferIds = await contract.getUserTransfers(address);
    return transferIds.map((id: bigint) => Number(id));
  } catch (error) {
    console.error("Error al obtener transferencias del usuario:", error);
    return [];
  }
}

/**
 * Obtener historial de transferencias de un token específico
 */
export async function getTokenTransfers(tokenId: number): Promise<Transfer[]> {
  try {
    const contract = getContract();
    // Obtener el nextTransferId
    const nextTransferId = await contract.nextTransferId();
    const transfers: Transfer[] = [];

    // Iterar todas las transferencias y filtrar por tokenId
    for (let i = 1; i < Number(nextTransferId); i++) {
      try {
        const transfer = await getTransfer(i);
        if (transfer.tokenId === tokenId) {
          transfers.push(transfer);
        }
      } catch (error) {
        console.warn(`Transferencia con ID ${i} no encontrada`);
      }
    }

    // Ordenar por fecha descendente
    return transfers.sort((a, b) => b.dateCreated - a.dateCreated);
  } catch (error) {
    console.error("Error al obtener transferencias del token:", error);
    return [];
  }
}

/**
 * Crear una transferencia
 */
export async function transferToken(
  signer: JsonRpcSigner,
  to: string,
  tokenId: number,
  amount: number
): Promise<void> {
  try {
    const contract = getContractWithSigner(signer);
    const tx = await contract.transfer(to, tokenId, amount);
    await tx.wait();
  } catch (error: any) {
    console.error("Error al transferir token:", error);
    throw new Error(error.reason || error.message || "Error al transferir token");
  }
}

/**
 * Aceptar una transferencia
 */
export async function acceptTransfer(signer: JsonRpcSigner, transferId: number): Promise<void> {
  try {
    const contract = getContractWithSigner(signer);
    const tx = await contract.acceptTransfer(transferId);
    await tx.wait();
  } catch (error: any) {
    console.error("Error al aceptar transferencia:", error);
    throw new Error(error.reason || error.message || "Error al aceptar transferencia");
  }
}

/**
 * Rechazar una transferencia
 */
export async function rejectTransfer(signer: JsonRpcSigner, transferId: number): Promise<void> {
  try {
    const contract = getContractWithSigner(signer);
    const tx = await contract.rejectTransfer(transferId);
    await tx.wait();
  } catch (error: any) {
    console.error("Error al rechazar transferencia:", error);
    throw new Error(error.reason || error.message || "Error al rechazar transferencia");
  }
}

/**
 * Obtener todas las transferencias del sistema (para administradores)
 */
export async function getAllTransfers(): Promise<Transfer[]> {
  try {
    const contract = getContract();
    const nextTransferId = await contract.nextTransferId();
    const transfers: Transfer[] = [];

    // Iterar desde 1 hasta nextTransferId - 1
    for (let i = 1; i < Number(nextTransferId); i++) {
      try {
        const transfer = await getTransfer(i);
        transfers.push(transfer);
      } catch (err) {
        console.warn(`Transferencia con ID ${i} no encontrada`);
      }
    }

    return transfers;
  } catch (error) {
    console.error("Error al obtener todas las transferencias:", error);
    throw error;
  }
}

// ========== UTILIDADES ==========

/**
 * Formatear timestamp a fecha legible
 */
export function formatDate(timestamp: number): string {
  if (timestamp === 0) return "-";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("es-ES");
}

/**
 * Validar formato de dirección Ethereum
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Parsear JSON de features de forma segura
 */
export function parseFeatures(featuresJson: string): Record<string, any> {
  try {
    return JSON.parse(featuresJson);
  } catch {
    return { raw: featuresJson };
  }
}