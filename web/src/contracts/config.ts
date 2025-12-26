/**
 * Configuracion de contratos y red
 *
 * IMPORTANTE: Actualizar estas direcciones despues de cada despliegue
 */

import SupplyChainABI from "./SupplyChain.json";

export const CONTRACT_CONFIG = {
  address: "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8",
  abi: SupplyChainABI.abi,
  chainId: 31337, // Anvil local
  chainName: "Anvil Local",
  rpcUrl: "http://127.0.0.1:8545",
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
} as const;

// Network configuration (para Web3Context)
export const NETWORK_CONFIG = {
  chainId: 31337,
  name: "Anvil Local",
  rpcUrl: "http://127.0.0.1:8545",
} as const;

// Roles disponibles
export const ROLES = {
  PRODUCER: "PRODUCER",
  FACTORY: "FACTORY",
  RETAILER: "RETAILER",
  CONSUMER: "CONSUMER",
} as const;

// Estados de usuario
export enum UserStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Canceled = 3,
}

export const USER_STATUS_LABELS = {
  [UserStatus.Pending]: "Pendiente",
  [UserStatus.Approved]: "Aprobado",
  [UserStatus.Rejected]: "Rechazado",
  [UserStatus.Canceled]: "Cancelado",
};

// Estados de transferencia
export enum TransferStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}

export const TRANSFER_STATUS_LABELS = {
  [TransferStatus.Pending]: "Pendiente",
  [TransferStatus.Accepted]: "Aceptada",
  [TransferStatus.Rejected]: "Rechazada",
};
