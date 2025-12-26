# Supply Chain Tracker - Smart Contract

Smart contract de trazabilidad para supply chain desarrollado con Solidity y Foundry.

## 📋 Requisitos

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## 🚀 Instalación

```bash
# Clonar dependencias
forge install

# Compilar contratos
forge build
```

## 🧪 Tests

El proyecto cuenta con **50 tests** que cubren todos los aspectos del contrato:

```bash
# Ejecutar todos los tests
forge test

# Ejecutar tests con verbosidad (ver detalles)
forge test -vv

# Ejecutar tests con gas report
forge test --gas-report

# Ejecutar un test específico
forge test --match-test testCompleteSupplyChainFlow -vvvv
```

### Cobertura de Tests

- ✅ Gestión de usuarios (registro, aprobación, roles)
- ✅ Creación de tokens con metadata y parentId
- ✅ Sistema de transferencias con aprobación
- ✅ Validación de flujo de roles (Producer → Factory → Retailer → Consumer)
- ✅ Funciones auxiliares (getUserTokens, getUserTransfers)
- ✅ Flujos completos end-to-end con trazabilidad

## 📦 Despliegue

### Despliegue en Anvil (Local)

1. **Iniciar Anvil** (blockchain local):
```bash
anvil
```

2. **Configurar variables de entorno**:
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# El archivo ya tiene configurada la private key de la cuenta #0 de Anvil
```

3. **Desplegar el contrato**:
```bash
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

4. **Resultado esperado**:
```
===========================================
SupplyChain Contract Deployed Successfully!
===========================================
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Admin Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Network: Anvil (Local)
===========================================
```

### Despliegue en Testnet (Sepolia/Goerli)

```bash
# Configurar RPC_URL y PRIVATE_KEY en .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
```

## 🏗️ Arquitectura del Contrato

### Enums
- **UserStatus**: Pending, Approved, Rejected, Canceled
- **TransferStatus**: Pending, Accepted, Rejected

### Structs
- **User**: Información de usuarios y roles
- **Token**: Tokens NFT con metadata y trazabilidad (parentId)
- **Transfer**: Transferencias pendientes/completadas

### Funciones Principales

#### Gestión de Usuarios
- `requestUserRole(string role)` - Solicitar registro con rol
- `changeStatusUser(address, UserStatus)` - Aprobar/rechazar usuario (admin)
- `getUserInfo(address)` - Obtener información de usuario
- `isAdmin(address)` - Verificar si es admin

#### Gestión de Tokens
- `createToken(name, totalSupply, features, parentId)` - Crear token
- `getToken(tokenId)` - Obtener información del token
- `getTokenBalance(tokenId, address)` - Consultar balance
- `getUserTokens(address)` - Listar tokens del usuario

#### Transferencias
- `transfer(to, tokenId, amount)` - Solicitar transferencia
- `acceptTransfer(transferId)` - Aceptar transferencia
- `rejectTransfer(transferId)` - Rechazar transferencia
- `getTransfer(transferId)` - Obtener info de transferencia
- `getUserTransfers(address)` - Listar transferencias del usuario

## 🔐 Reglas de Negocio

1. **Flujo de Roles (Unidireccional)**:
   - Producer → Factory
   - Factory → Retailer
   - Retailer → Consumer
   - Consumer NO puede transferir

2. **Sistema de Aprobación**:
   - Solo usuarios aprobados pueden operar
   - Las transferencias requieren aceptación del receptor
   - El admin gestiona aprobaciones de usuarios

3. **Trazabilidad**:
   - Tokens pueden tener un `parentId` para rastrear origen
   - Metadata en formato JSON para información adicional
   - Historial completo de transferencias

## 📊 Gas Optimization

El contrato utiliza:
- Mappings para búsquedas O(1)
- Arrays dinámicos para listas de usuarios
- Eventos indexados para queries eficientes
- Validaciones tempranas para ahorrar gas

## 🔍 Verificación en Etherscan

```bash
forge verify-contract <CONTRACT_ADDRESS> src/SupplyChain.sol:SupplyChain --chain-id 11155111
```

## 📝 Licencia

MIT
