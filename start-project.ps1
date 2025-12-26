# Script PowerShell para levantar el proyecto completo Supply Chain Tracker
# Este script:
# 1. Levanta Anvil en segundo plano
# 2. Despliega los contratos
# 3. Actualiza la configuracion web con la direccion del contrato
# 4. Levanta el servidor de desarrollo Next.js

$ErrorActionPreference = "Stop"

# Colores
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Blue "========================================"
Write-ColorOutput Blue "Supply Chain Tracker - Iniciando Proyecto"
Write-ColorOutput Blue "========================================"
Write-Output ""

# Variables globales para PIDs
$global:AnvilProcess = $null
$global:WebProcess = $null

# Funcion de limpieza
function Cleanup {
    Write-Output ""
    Write-ColorOutput Yellow "Deteniendo procesos..."

    if ($global:AnvilProcess) {
        Stop-Process -Id $global:AnvilProcess.Id -Force -ErrorAction SilentlyContinue
        Write-ColorOutput Green "[OK] Anvil detenido"
    }

    if ($global:WebProcess) {
        Stop-Process -Id $global:WebProcess.Id -Force -ErrorAction SilentlyContinue
        Write-ColorOutput Green "[OK] Servidor web detenido"
    }

    # Limpiar procesos de node que puedan quedar
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Registrar evento de salida
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup } | Out-Null

# Paso 1: Verificar directorio
if (!(Test-Path "sc") -or !(Test-Path "web")) {
    Write-ColorOutput Red "Error: Este script debe ejecutarse desde la raiz del proyecto supply-chain-tracker"
    exit 1
}

# Paso 2: Levantar Anvil
Write-ColorOutput Yellow "[1/5] Levantando Anvil..."
# Buscar anvil en ubicaciones comunes
$anvilPath = $null
$possiblePaths = @(
    "$env:USERPROFILE\.foundry\bin\anvil.exe",
    "C:\Users\$env:USERNAME\.foundry\bin\anvil.exe",
    (Get-Command anvil -ErrorAction SilentlyContinue).Source
)
foreach ($path in $possiblePaths) {
    if ($path -and (Test-Path $path)) {
        $anvilPath = $path
        break
    }
}
if (!$anvilPath) {
    Write-ColorOutput Red "Error: No se encontro anvil. Asegurate de que Foundry este instalado."
    exit 1
}
$global:AnvilProcess = Start-Process -FilePath $anvilPath -WindowStyle Hidden -RedirectStandardOutput "anvil.log" -RedirectStandardError "anvil-error.log" -PassThru
Write-ColorOutput Green "[OK] Anvil iniciado (PID: $($global:AnvilProcess.Id))"
Write-ColorOutput Blue "  Esperando 3 segundos para que Anvil este listo..."
Start-Sleep -Seconds 3

# Paso 3: Desplegar contratos
Write-Output ""
Write-ColorOutput Yellow "[2/5] Desplegando contratos..."
Set-Location sc

# Buscar forge en ubicaciones comunes
$forgePath = $null
$possibleForgePaths = @(
    "$env:USERPROFILE\.foundry\bin\forge.exe",
    "C:\Users\$env:USERNAME\.foundry\bin\forge.exe",
    (Get-Command forge -ErrorAction SilentlyContinue).Source
)
foreach ($path in $possibleForgePaths) {
    if ($path -and (Test-Path $path)) {
        $forgePath = $path
        break
    }
}
if (!$forgePath) {
    Write-ColorOutput Red "Error: No se encontro forge. Asegurate de que Foundry este instalado."
    Set-Location ..
    Cleanup
    exit 1
}

# Compilar contratos
Write-ColorOutput Blue "  Compilando contratos..."
& $forgePath build | Out-Null

# Desplegar contrato
Write-ColorOutput Blue "  Desplegando SupplyChain.sol..."
# Usar la primera private key de Anvil (cuenta admin)
$privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$deployOutput = & $forgePath script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --private-key $privateKey --broadcast 2>&1 | Out-String

# Extraer la direccion del contrato
$contractAddress = if ($deployOutput -match "Contract Address: (0x[a-fA-F0-9]{40})") { $matches[1] } else { $null }

if (!$contractAddress) {
    Write-ColorOutput Red "Error: No se pudo obtener la direccion del contrato desplegado"
    Write-ColorOutput Red "Output del despliegue:"
    Write-Output $deployOutput
    Cleanup
    exit 1
}

Write-ColorOutput Green "[OK] Contrato desplegado en: $contractAddress"

# Admin address (primera cuenta de Anvil)
$adminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
Write-ColorOutput Green "[OK] Admin address: $adminAddress"

Set-Location ..

# Paso 4: Actualizar configuracion web
Write-Output ""
Write-ColorOutput Yellow "[3/5] Actualizando configuracion web..."

# Copiar ABI
Write-ColorOutput Blue "  Copiando ABI..."
Copy-Item "sc\out\SupplyChain.sol\SupplyChain.json" "web\src\contracts\SupplyChain.json" -Force
Write-ColorOutput Green "[OK] ABI copiado"

# Actualizar config.ts
Write-ColorOutput Blue "  Actualizando config.ts con las nuevas direcciones..."
$configContent = @"
/**
 * Configuracion de contratos y red
 *
 * IMPORTANTE: Actualizar estas direcciones despues de cada despliegue
 */

import SupplyChainABI from "./SupplyChain.json";

export const CONTRACT_CONFIG = {
  address: "$contractAddress",
  abi: SupplyChainABI.abi,
  chainId: 31337, // Anvil local
  chainName: "Anvil Local",
  rpcUrl: "http://127.0.0.1:8545",
  adminAddress: "$adminAddress",
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
"@

Set-Content -Path "web\src\contracts\config.ts" -Value $configContent
Write-ColorOutput Green "[OK] Configuracion actualizada"

# Paso 5: Instalar dependencias
Write-Output ""
Write-ColorOutput Yellow "[4/5] Verificando dependencias de Next.js..."
Set-Location web

if (!(Test-Path "node_modules")) {
    Write-ColorOutput Blue "  Instalando dependencias..."
    npm install
    Write-ColorOutput Green "[OK] Dependencias instaladas"
} else {
    Write-ColorOutput Green "[OK] Dependencias ya instaladas"
}

# Paso 6: Levantar servidor Next.js
Write-Output ""
Write-ColorOutput Yellow "[5/5] Iniciando servidor Next.js..."
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (!$npmCmd) {
    Write-ColorOutput Red "Error: No se encontro npm. Asegurate de que Node.js este instalado."
    Cleanup
    exit 1
}
# En Windows, npm es un .cmd, necesitamos usar cmd.exe para ejecutarlo
$global:WebProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm", "run", "dev" -PassThru -NoNewWindow
Write-ColorOutput Green "[OK] Servidor web iniciado (PID: $($global:WebProcess.Id))"

Write-ColorOutput Blue "  Esperando a que el servidor este listo..."
Start-Sleep -Seconds 5

# Resumen final
Write-Output ""
Write-ColorOutput Green "========================================"
Write-ColorOutput Green "[OK] Proyecto iniciado correctamente"
Write-ColorOutput Green "========================================"
Write-Output ""

Write-ColorOutput Blue "Informacion del despliegue:"
Write-Output "  - Anvil RPC:           http://localhost:8545"
Write-Output "  - Contract Address:    $contractAddress"
Write-Output "  - Admin Address:       $adminAddress"
Write-Output "  - Aplicacion Web:      http://localhost:3000"
Write-Output "  - Chain ID:            31337"

Write-Output ""
Write-ColorOutput Blue "Cuentas de prueba de Anvil:"
Write-Output "  1. Admin:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
Write-Output "  2. Producer:  0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
Write-Output "  3. Factory:   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
Write-Output "  4. Retailer:  0x90F79bf6EB2c4f870365E785982E1f101E93b906"
Write-Output "  5. Consumer:  0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

Write-Output ""
Write-ColorOutput Blue "Private Keys (para MetaMask):"
Write-Output "  1. 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
Write-Output "  2. 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
Write-Output "  3. 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
Write-Output "  4. 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
Write-Output "  5. 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"

Write-Output ""
Write-ColorOutput Yellow "Logs:"
Write-Output "  - Anvil:      Get-Content anvil.log -Wait"
Write-Output "  - Next.js:    Ver proceso separado"

Write-Output ""
Write-ColorOutput Yellow "Presiona Ctrl+C para detener todos los servicios"
Write-Output ""

# Esperar
try {
    Wait-Process -Id $global:WebProcess.Id
} catch {
    Cleanup
}
