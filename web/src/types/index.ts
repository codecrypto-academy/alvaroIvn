// Tipos TypeScript para el proyecto Supply Chain Tracker

import { UserStatus, TransferStatus, ROLES } from "@/contracts/config";

export type Role = typeof ROLES[keyof typeof ROLES];

// Tipos de datos del smart contract
export interface User {
  id: number;
  userAddress: string;
  role: string;
  status: UserStatus;
}

export interface Token {
  id: number;
  creator: string;
  name: string;
  totalSupply: number;
  features: string;
  parentId: number;
  dateCreated: number;
}

export interface Transfer {
  id: number;
  from: string;
  to: string;
  tokenId: number;
  dateCreated: number;
  amount: number;
  status: TransferStatus;
}

// Tipos extendidos para la UI
export interface TokenWithBalance extends Token {
  balance: number;
  pendingTransfers?: number;
}

export interface TransferWithDetails extends Transfer {
  tokenName?: string;
  fromRole?: string;
  toRole?: string;
}

// Tipos para formularios
export interface CreateTokenForm {
  name: string;
  totalSupply: number;
  features: string;
  parentId: number;
}

export interface TransferTokenForm {
  to: string;
  tokenId: number;
  amount: number;
}

export interface RequestRoleForm {
  role: Role;
}