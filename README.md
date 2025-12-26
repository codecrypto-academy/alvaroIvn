# Supply Chain Tracker

Sistema de trazabilidad de cadena de suministro basado en blockchain Ethereum, utilizando NFTs para rastrear productos desde su origen hasta el consumidor final.

## Descripción

Supply Chain Tracker es una aplicación descentralizada (dApp) que permite:

- Gestionar usuarios con diferentes roles (Producer, Factory, Retailer, Consumer)
- Crear tokens NFT que representan productos con metadata y trazabilidad
- Transferir productos a través de la cadena de suministro con sistema de aprobación
- Rastrear el origen y el historial completo de cada producto
- Administrar permisos y validar el flujo correcto entre roles

## Estructura del Proyecto

```
supply-chain-tracker/
├── sc/                      # Smart Contracts (Solidity + Foundry)
│   ├── src/                 # Código fuente de los contratos
│   ├── script/              # Scripts de despliegue
│   ├── test/                # Tests unitarios (50+ tests)
│   └── README.md            # Documentación del contrato
├── web/                     # Frontend (Next.js + TypeScript)
│   ├── src/
│   │   ├── app/             # Páginas de Next.js
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Contextos de React
│   │   ├── hooks/           # Custom hooks
│   │   ├── contracts/       # ABIs y configuración
│   │   └── types/           # Definiciones TypeScript
│   └── package.json
├── start-project.ps1        # Script de inicio (Windows)
├── start-project.sh         # Script de inicio (Linux/Mac)
├── stop-project.ps1         # Script de parada (Windows)
└── stop-project.sh          # Script de parada (Linux/Mac)
```

## Requisitos Previos

### 1. Node.js y npm
```bash
# Verificar instalación
node --version  # v20.x o superior
npm --version   # v10.x o superior
```
Descargar desde: https://nodejs.org/

### 2. Foundry (para smart contracts)
```bash
# Instalar Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar instalación
forge --version
anvil --version
cast --version
```
Documentación: https://book.getfoundry.sh/getting-started/installation

### 3. Git
```bash
# Verificar instalación
git --version
```

## Instalación

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd supply-chain-tracker
```

### 2. Instalar Dependencias del Smart Contract
```bash
cd sc
forge install
forge build
cd ..
```

### 3. Instalar Dependencias del Frontend
```bash
cd web
npm install
cd ..
```

### 4. Configurar Variables de Entorno (Opcional)

Si deseas desplegar en una red específica, crea un archivo `.env` en la carpeta `sc/`:

```bash
cd sc
cp .env.example .env
```

Edita `.env` con tus configuraciones:
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
```

## Iniciar el Proyecto

El proyecto incluye scripts automatizados que:
1. Inician una blockchain local (Anvil)
2. Despliegan los contratos
3. Configuran el frontend con la dirección del contrato
4. Levantan el servidor de desarrollo

### En Windows (PowerShell)
```powershell
.\start-project.ps1
```

### En Linux/Mac (Bash)
```bash
chmod +x start-project.sh
./start-project.sh
```

El script mostrará:
```
========================================
Supply Chain Tracker - Iniciando Proyecto
========================================

[OK] Anvil iniciado (PID: xxxxx)
[OK] Contratos desplegados
     Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
[OK] Configuración web actualizada
[OK] Servidor web iniciado en http://localhost:3000

========================================
Proyecto iniciado exitosamente!
========================================
```

### Acceder a la Aplicación
Abre tu navegador en: http://localhost:3000

## Detener el Proyecto

### En Windows (PowerShell)
```powershell
.\stop-project.ps1
```

### En Linux/Mac (Bash)
```bash
./stop-project.sh
```

## Inicio Manual (Paso a Paso)

Si prefieres iniciar cada componente manualmente:

### 1. Iniciar Blockchain Local
```bash
cd sc
anvil
# Déjalo corriendo en esta terminal
```

### 2. Desplegar Contratos (en otra terminal)
```bash
cd sc
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

Copia la dirección del contrato desplegado.

### 3. Configurar Frontend
```bash
cd web
# Edita src/contracts/config.ts con la dirección del contrato
```

### 4. Iniciar Servidor Web
```bash
cd web
npm run dev
```

## Testing

### Tests del Smart Contract
```bash
cd sc

# Ejecutar todos los tests (50+ tests)
forge test

# Tests con detalles
forge test -vv

# Tests con reporte de gas
forge test --gas-report

# Test específico
forge test --match-test testCompleteSupplyChainFlow -vvvv

# Cobertura
forge coverage
```

### Tests del Frontend
```bash
cd web

# Tests unitarios
npm test

# Tests con watch mode
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Tests E2E
npm run test:e2e

# Todos los tests
npm run test:all
```

## Tecnologías Utilizadas

### Smart Contracts
- **Solidity** 0.8.x - Lenguaje de contratos inteligentes
- **Foundry** - Framework de desarrollo y testing
- **Anvil** - Blockchain local de desarrollo

### Frontend
- **Next.js** 14.x - Framework React con SSR
- **TypeScript** - Tipado estático
- **Ethers.js** 6.x - Librería para interactuar con Ethereum
- **Tailwind CSS** - Framework de estilos
- **React** 18.x - Librería de UI
- **Jest** - Testing unitario
- **Playwright** - Testing E2E

## Funcionalidades Principales

### Sistema de Usuarios
- Registro de usuarios con roles específicos
- Aprobación/rechazo por administrador
- Roles: Producer, Factory, Retailer, Consumer

### Gestión de Tokens
- Creación de tokens NFT con metadata
- Trazabilidad mediante `parentId`
- Consulta de balances y tokens por usuario

### Sistema de Transferencias
- Transferencias con aprobación del receptor
- Validación de flujo de roles (Producer → Factory → Retailer → Consumer)
- Historial completo de transferencias

### Trazabilidad
- Seguimiento del origen de productos (parentId)
- Historial de todas las transferencias
- Metadata en formato JSON

## Flujo de Roles

El sistema implementa un flujo unidireccional estricto:

```
Producer → Factory → Retailer → Consumer
```

- **Producer**: Crea tokens iniciales (materias primas)
- **Factory**: Transforma productos (puede crear tokens con parentId)
- **Retailer**: Distribuye productos
- **Consumer**: Consumidor final (no puede transferir)

## Documentación Adicional

- [Documentación del Smart Contract](sc/README.md) - Detalles técnicos del contrato
- [FASE1_COMPLETADA.md](FASE1_COMPLETADA.md) - Estado del desarrollo Fase 1
- [FASE2_GUIA_COMPLETA.md](FASE2_GUIA_COMPLETA.md) - Guía de desarrollo Fase 2
- [README_SCRIPTS.md](README_SCRIPTS.md) - Documentación de scripts

## Solución de Problemas

### Anvil no inicia
```bash
# Verificar que no hay otra instancia corriendo
pkill anvil

# Limpiar logs
rm anvil.log anvil-error.log
```

### Error al desplegar contratos
```bash
# Limpiar y recompilar
cd sc
forge clean
forge build
```

### Frontend no se conecta al contrato
1. Verifica que Anvil esté corriendo
2. Confirma que la dirección del contrato en `web/src/contracts/config.ts` es correcta
3. Revisa que MetaMask esté conectado a `http://localhost:8545`
4. Importa una cuenta de Anvil en MetaMask usando una de las claves privadas mostradas

### Puerto 3000 ya en uso
```bash
# Cambiar puerto en package.json o matar proceso
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

## Configuración de MetaMask

Para interactuar con la aplicación necesitas configurar MetaMask:

1. **Agregar red local**
   - Network Name: Anvil Local
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. **Importar cuenta de prueba**

   Anvil proporciona 10 cuentas de prueba. La primera es:
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

## Seguridad

- No compartas tus claves privadas
- El archivo `.env` está en `.gitignore`
- Las cuentas de Anvil son solo para desarrollo local
- No uses las claves de prueba de Anvil en mainnet

## Licencia

MIT

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.

---

Desarrollado para el curso de CodeCrypto
