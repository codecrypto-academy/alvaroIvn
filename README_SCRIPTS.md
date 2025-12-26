# Scripts de Automatización - Supply Chain Tracker

Este proyecto incluye scripts para automatizar el proceso de despliegue y ejecución completa.

## Scripts Disponibles

### 🚀 Iniciar Proyecto

#### Linux/Mac:
```bash
chmod +x start-project.sh
./start-project.sh
```

#### Windows (PowerShell):
```powershell
.\start-project.ps1
```

**Este script hace:**
1. ✅ Levanta Anvil en segundo plano (red local de Ethereum)
2. ✅ Compila los contratos inteligentes
3. ✅ Despliega el contrato SupplyChain
4. ✅ Copia el ABI al proyecto web
5. ✅ Actualiza automáticamente `config.ts` con las direcciones desplegadas
6. ✅ Instala dependencias de Next.js (si es necesario)
7. ✅ Levanta el servidor de desarrollo Next.js

### 🛑 Detener Proyecto

#### Linux/Mac:
```bash
chmod +x stop-project.sh
./stop-project.sh
```

#### Windows (PowerShell):
```powershell
.\stop-project.ps1
```

**Este script hace:**
- Detiene Anvil
- Detiene el servidor Next.js
- Limpia procesos residuales
- Elimina logs temporales

## Información Importante

### Direcciones Generadas

Después de ejecutar el script de inicio, verás información como:

```
Información del despliegue:
  • Anvil RPC:           http://localhost:8545
  • Contract Address:    0x5FbDB2315678afecb367f032d93F642f64180aa3
  • Admin Address:       0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  • Aplicación Web:      http://localhost:3000
  • Chain ID:            31337
```

### Cuentas de Prueba (Anvil)

El script muestra 5 cuentas pre-configuradas con sus addresses y private keys:

| Rol Sugerido | Address | Private Key |
|-------------|---------|-------------|
| **Admin** | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| **Producer** | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| **Factory** | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |
| **Retailer** | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 |
| **Consumer** | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 | 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a |

## Configuración de MetaMask

1. **Agregar Red Anvil Local:**
   - Network Name: `Anvil Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Importar Cuentas:**
   - Usa las private keys mostradas arriba
   - Cada cuenta viene con ~10,000 ETH de prueba

## Flujo de Trabajo Recomendado

### Primera Vez
```bash
# 1. Iniciar todo el proyecto
./start-project.sh  # o .ps1 en Windows

# 2. Configurar MetaMask con la red Anvil y las cuentas

# 3. Acceder a http://localhost:3000

# 4. Conectar con la cuenta Admin y aprobar usuarios

# 5. Usar diferentes cuentas para probar el flujo
```

### Desarrollo Continuo
```bash
# Si ya tienes todo configurado, simplemente:
./start-project.sh

# Cuando termines:
./stop-project.sh
```

### Re-desplegar Contratos
```bash
# Detener todo
./stop-project.sh

# Volver a iniciar (re-despliega automáticamente)
./start-project.sh
```

## Logs y Debugging

### Ver logs de Anvil:
```bash
# Linux/Mac
tail -f anvil.log

# Windows
Get-Content anvil.log -Wait
```

### Ver logs de Next.js:
Los logs de Next.js se muestran directamente en la terminal donde ejecutaste el script.

## Troubleshooting

### Error: "Puerto 8545 ya en uso"
```bash
# Detener procesos existentes
./stop-project.sh
# O manualmente:
pkill anvil  # Linux/Mac
Stop-Process -Name "anvil" -Force  # Windows
```

### Error: "Puerto 3000 ya en uso"
```bash
# Detener Next.js
pkill -f "next dev"  # Linux/Mac
Stop-Process -Name "node" -Force  # Windows
```

### Error: "No se puede conectar al contrato"
- Verifica que Anvil esté corriendo: `ps aux | grep anvil`
- Verifica la configuración en `web/src/contracts/config.ts`
- Re-ejecuta el script de inicio

### La configuración no se actualiza
- El script automáticamente actualiza `web/src/contracts/config.ts`
- Si algo falla, puedes copiar manualmente la dirección del contrato del output

## Estructura de Archivos Generados

```
supply-chain-tracker/
├── anvil.log                    # Logs de Anvil (generado)
├── anvil-error.log              # Errores de Anvil (generado)
├── start-project.sh             # Script de inicio (Linux/Mac)
├── start-project.ps1            # Script de inicio (Windows)
├── stop-project.sh              # Script de parada (Linux/Mac)
├── stop-project.ps1             # Script de parada (Windows)
└── web/src/contracts/
    ├── SupplyChain.json         # ABI (actualizado automáticamente)
    └── config.ts                # Configuración (actualizada automáticamente)
```

## Notas Adicionales

- **Auto-actualización:** El script actualiza automáticamente todas las configuraciones necesarias
- **Limpieza:** Al detener, se limpian todos los procesos y archivos temporales
- **Idempotencia:** Puedes ejecutar `start-project` múltiples veces sin problemas
- **Estado persistente:** Cada vez que ejecutas el script, Anvil se reinicia con un estado limpio

## Comandos Manuales (Alternativa)

Si prefieres ejecutar paso a paso:

```bash
# Terminal 1: Anvil
anvil

# Terminal 2: Desplegar contratos
cd contracts
forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Copiar ABI y actualizar config
cp contracts/out/SupplyChain.sol/SupplyChain.json web/src/contracts/
# Actualizar manualmente config.ts con la dirección

# Terminal 4: Levantar web
cd web
npm run dev
```

## Soporte

Si encuentras problemas:
1. Verifica que tienes instalado: `anvil`, `forge`, `node`, `npm`
2. Ejecuta `./stop-project.sh` para limpiar
3. Vuelve a ejecutar `./start-project.sh`
4. Revisa los logs en `anvil.log`
