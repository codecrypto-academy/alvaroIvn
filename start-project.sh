#!/bin/bash

# Script para levantar el proyecto completo Supply Chain Tracker
# Este script:
# 1. Levanta Anvil en segundo plano
# 2. Despliega los contratos
# 3. Actualiza la configuración web con la dirección del contrato
# 4. Levanta el servidor de desarrollo Next.js

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Supply Chain Tracker - Iniciando Proyecto${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Función para limpiar procesos al salir
cleanup() {
    echo -e "\n${YELLOW}Deteniendo procesos...${NC}"
    if [ ! -z "$ANVIL_PID" ]; then
        kill $ANVIL_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Anvil detenido${NC}"
    fi
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Servidor web detenido${NC}"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Paso 1: Verificar que estamos en el directorio correcto
if [ ! -d "sc" ] || [ ! -d "web" ]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde la raíz del proyecto supply-chain-tracker${NC}"
    exit 1
fi

# Paso 2: Levantar Anvil
echo -e "${YELLOW}[1/5] Levantando Anvil...${NC}"
anvil > anvil.log 2>&1 &
ANVIL_PID=$!
echo -e "${GREEN}✓ Anvil iniciado (PID: $ANVIL_PID)${NC}"
echo -e "${BLUE}  Esperando 3 segundos para que Anvil esté listo...${NC}"
sleep 3

# Paso 3: Desplegar contratos
echo -e "\n${YELLOW}[2/5] Desplegando contratos...${NC}"
cd sc

# Compilar contratos
echo -e "${BLUE}  Compilando contratos...${NC}"
forge build

# Desplegar contrato
echo -e "${BLUE}  Desplegando SupplyChain.sol...${NC}"
# Usar la primera private key de Anvil (cuenta admin)
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY --broadcast 2>&1)

# Extraer la dirección del contrato desplegado
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "Contract Address: \K0x[a-fA-F0-9]{40}" | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}Error: No se pudo obtener la dirección del contrato desplegado${NC}"
    echo -e "${RED}Output del despliegue:${NC}"
    echo "$DEPLOY_OUTPUT"
    cleanup
    exit 1
fi

echo -e "${GREEN}✓ Contrato desplegado en: ${CONTRACT_ADDRESS}${NC}"

# Extraer el admin address (primera cuenta de Anvil)
ADMIN_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo -e "${GREEN}✓ Admin address: ${ADMIN_ADDRESS}${NC}"

cd ..

# Paso 4: Actualizar configuración web
echo -e "\n${YELLOW}[3/5] Actualizando configuración web...${NC}"

# Copiar ABI
echo -e "${BLUE}  Copiando ABI...${NC}"
cp sc/out/SupplyChain.sol/SupplyChain.json web/src/contracts/SupplyChain.json
echo -e "${GREEN}✓ ABI copiado${NC}"

# Actualizar config.ts
echo -e "${BLUE}  Actualizando config.ts con las nuevas direcciones...${NC}"
cat > web/src/contracts/config.ts << EOF
/**
 * Configuración de contratos y red
 *
 * IMPORTANTE: Actualizar estas direcciones después de cada despliegue
 */

import SupplyChainABI from "./SupplyChain.json";

export const CONTRACT_CONFIG = {
  address: "${CONTRACT_ADDRESS}",
  abi: SupplyChainABI.abi,
  chainId: 31337, // Anvil local
  chainName: "Anvil Local",
  rpcUrl: "http://127.0.0.1:8545",
  adminAddress: "${ADMIN_ADDRESS}",
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
EOF

echo -e "${GREEN}✓ Configuración actualizada${NC}"

# Paso 5: Instalar dependencias si es necesario
echo -e "\n${YELLOW}[4/5] Verificando dependencias de Next.js...${NC}"
cd web
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}  Instalando dependencias...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
fi

# Paso 6: Levantar servidor Next.js
echo -e "\n${YELLOW}[5/5] Iniciando servidor Next.js...${NC}"
npm run dev &
WEB_PID=$!
echo -e "${GREEN}✓ Servidor web iniciado (PID: $WEB_PID)${NC}"

# Esperar a que el servidor esté listo
echo -e "${BLUE}  Esperando a que el servidor esté listo...${NC}"
sleep 5

# Resumen final
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Proyecto iniciado correctamente${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Información del despliegue:${NC}"
echo -e "  • Anvil RPC:           ${GREEN}http://localhost:8545${NC}"
echo -e "  • Contract Address:    ${GREEN}${CONTRACT_ADDRESS}${NC}"
echo -e "  • Admin Address:       ${GREEN}${ADMIN_ADDRESS}${NC}"
echo -e "  • Aplicación Web:      ${GREEN}http://localhost:3000${NC}"
echo -e "  • Chain ID:            ${GREEN}31337${NC}"

echo -e "\n${BLUE}Cuentas de prueba de Anvil:${NC}"
echo -e "  1. Admin:     ${GREEN}0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266${NC}"
echo -e "  2. Producer:  ${GREEN}0x70997970C51812dc3A010C7d01b50e0d17dc79C8${NC}"
echo -e "  3. Factory:   ${GREEN}0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC${NC}"
echo -e "  4. Retailer:  ${GREEN}0x90F79bf6EB2c4f870365E785982E1f101E93b906${NC}"
echo -e "  5. Consumer:  ${GREEN}0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65${NC}"

echo -e "\n${BLUE}Private Keys (para MetaMask):${NC}"
echo -e "  1. 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo -e "  2. 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
echo -e "  3. 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
echo -e "  4. 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
echo -e "  5. 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"

echo -e "\n${YELLOW}Logs:${NC}"
echo -e "  • Anvil:      ${BLUE}tail -f anvil.log${NC}"
echo -e "  • Next.js:    Visible en esta terminal"

echo -e "\n${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}\n"

# Esperar
wait $WEB_PID
