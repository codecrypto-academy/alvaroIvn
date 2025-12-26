# Corrección de Scripts de Inicio - Supply Chain Tracker

**Fecha:** 23 de diciembre de 2025
**Tema:** Corrección de errores en scripts PowerShell y Bash para inicio del proyecto

---

## Problema Inicial

Al ejecutar `.\start-project.ps1`, se recibían múltiples errores de sintaxis relacionados con:
1. Caracteres UTF-8 especiales (✓, •, tildes)
2. Problemas de encoding en PowerShell
3. Rutas de comandos no encontradas

### Error Principal
```
Token '}' inesperado en la expresión o la instrucción.
Falta la cadena en el terminador: ".
```

---

## Soluciones Implementadas

### 1. Corrección de Encoding (start-project.ps1)

**Problema:** Caracteres especiales UTF-8 causaban errores de parsing en PowerShell.

**Solución:** Reemplazar todos los caracteres especiales por ASCII:
- `✓` → `[OK]`
- `•` → `-`
- Eliminar todas las tildes (á, é, í, ó, ú, ñ)

### 2. Actualización de Rutas de Directorio

**Problema:** El script buscaba directorio `contracts` pero el directorio real es `sc`.

**Cambios realizados:**
```powershell
# Antes
if (!(Test-Path "contracts") -or !(Test-Path "web")) {

# Después
if (!(Test-Path "sc") -or !(Test-Path "web")) {
```

```powershell
# Antes
Set-Location contracts
Copy-Item "contracts\out\..."

# Después
Set-Location sc
Copy-Item "sc\out\..."
```

### 3. Búsqueda de Ejecutables de Foundry

**Problema:** PowerShell no encontraba `anvil` y `forge` en el PATH.

**Solución:** Implementar búsqueda en múltiples ubicaciones:
```powershell
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
```

### 4. Corrección del Script de Deploy

**Problema:** Nombre incorrecto del contrato y falta de private key.

**Cambios:**
```powershell
# Antes
forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://localhost:8545 --broadcast

# Después
$privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
& $forgePath script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --private-key $privateKey --broadcast
```

### 5. Corrección de Ejecución de npm

**Problema:** `Start-Process` no puede ejecutar archivos `.cmd` directamente en Windows.

**Solución:**
```powershell
# Antes
Start-Process -FilePath $npmCmd.Source -ArgumentList "run", "dev"

# Después
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm", "run", "dev"
```

### 6. Agregado de NETWORK_CONFIG

**Problema:** La aplicación web necesitaba `NETWORK_CONFIG` pero el script solo generaba `CONTRACT_CONFIG`.

**Solución:** Actualizar el contenido generado en `config.ts`:
```typescript
// Network configuration (para Web3Context)
export const NETWORK_CONFIG = {
  chainId: 31337,
  name: "Anvil Local",
  rpcUrl: "http://127.0.0.1:8545",
} as const;
```

### 7. Corrección de stop-project.ps1

**Problema:** Mismos errores de encoding UTF-8.

**Solución:**
- Reemplazar `✓` por `[OK]`
- Eliminar tildes
- Agregar limpieza de procesos `cmd.exe`

```powershell
# Detener procesos de cmd.exe que puedan haber quedado del npm run dev
$cmdProcesses = Get-Process -Name "cmd" -ErrorAction SilentlyContinue
if ($cmdProcesses) {
    $cmdProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
}
```

---

## Sincronización de Scripts Bash

Se actualizaron los scripts `.sh` para mantener consistencia con los cambios de PowerShell:

### Cambios en start-project.sh:
1. `contracts` → `sc` en todas las referencias
2. `DeploySupplyChain` → `Deploy`
3. Agregado de `--private-key` en el comando de deploy
4. Agregado de `NETWORK_CONFIG` en config.ts generado
5. Rutas actualizadas para ABI

**Nota:** Los caracteres UTF-8 (✓, •) se mantienen en scripts Bash ya que funcionan correctamente en entornos Linux/Mac.

---

## Archivos Modificados

### Scripts PowerShell
- ✅ `start-project.ps1` - Completamente reescrito sin caracteres UTF-8
- ✅ `stop-project.ps1` - Reescrito sin caracteres UTF-8

### Scripts Bash
- ✅ `start-project.sh` - Actualizado para usar directorio `sc` y contrato `Deploy`
- ⚠️ `stop-project.sh` - No requirió cambios (funciona correctamente)

### Configuración Web
- ✅ `web/src/contracts/config.ts` - Agregado `NETWORK_CONFIG`

---

## Estructura de Directorios

```
supply-chain-tracker/
├── sc/                          # Contratos Solidity (antes "contracts")
│   ├── script/
│   │   └── Deploy.s.sol        # Contrato: Deploy (no DeploySupplyChain)
│   └── out/
│       └── SupplyChain.sol/
│           └── SupplyChain.json
├── web/
│   └── src/
│       └── contracts/
│           ├── SupplyChain.json
│           └── config.ts        # Incluye CONTRACT_CONFIG y NETWORK_CONFIG
├── start-project.ps1            # Script de inicio Windows
├── stop-project.ps1             # Script de detención Windows
├── start-project.sh             # Script de inicio Linux/Mac
└── stop-project.sh              # Script de detención Linux/Mac
```

---

## Uso de los Scripts

### Windows (PowerShell)
```powershell
# Iniciar proyecto
.\start-project.ps1

# Detener proyecto
.\stop-project.ps1
```

### Linux/Mac (Bash)
```bash
# Iniciar proyecto
./start-project.sh

# Detener proyecto
./stop-project.sh
```

---

## Proceso Completo del Script de Inicio

1. **[1/5]** Levantar Anvil en segundo plano
   - Busca `anvil.exe` en ubicaciones estándar de Foundry
   - Redirige logs a `anvil.log` y `anvil-error.log`

2. **[2/5]** Compilar y desplegar contratos
   - Busca `forge.exe` en ubicaciones estándar
   - Compila contratos con `forge build`
   - Despliega usando cuenta admin de Anvil
   - Extrae dirección del contrato desplegado

3. **[3/5]** Actualizar configuración web
   - Copia ABI desde `sc/out/` a `web/src/contracts/`
   - Genera `config.ts` con direcciones actualizadas
   - Incluye `CONTRACT_CONFIG` y `NETWORK_CONFIG`

4. **[4/5]** Verificar/instalar dependencias
   - Revisa si existe `node_modules`
   - Ejecuta `npm install` si es necesario

5. **[5/5]** Iniciar servidor Next.js
   - Ejecuta `npm run dev` en segundo plano
   - Espera 5 segundos para que el servidor esté listo

---

## Información del Deployment

### Configuración de Red
- **RPC URL:** http://localhost:8545
- **Chain ID:** 31337 (Anvil Local)
- **Admin Address:** 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

### Cuentas de Prueba de Anvil
1. **Admin:** 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
2. **Producer:** 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
3. **Factory:** 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
4. **Retailer:** 0x90F79bf6EB2c4f870365E785982E1f101E93b906
5. **Consumer:** 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65

### Private Keys (para MetaMask)
1. 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
2. 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
3. 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
4. 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
5. 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

---

## Resolución de Problemas

### Error: "Cannot read properties of undefined (reading 'chainId')"
**Causa:** Faltaba `NETWORK_CONFIG` en config.ts
**Solución:** Ejecutar el script actualizado que genera `NETWORK_CONFIG`

### Error: "El término 'anvil' no se reconoce"
**Causa:** PowerShell no encuentra anvil en el PATH
**Solución:** El script ahora busca automáticamente en `$env:USERPROFILE\.foundry\bin\`

### Error: "forge.exe : Error: Could not find target contract"
**Causa:** Nombre incorrecto del contrato en Deploy.s.sol
**Solución:** Cambiado de `DeploySupplyChain` a `Deploy`

### Error: "%1 no es una aplicación Win32 válida"
**Causa:** Intentar ejecutar npm.cmd directamente con Start-Process
**Solución:** Usar `cmd.exe /c npm run dev`

---

## Notas Importantes

1. **Encoding:** Los scripts PowerShell ahora usan solo caracteres ASCII para evitar problemas de encoding
2. **Portabilidad:** Scripts Bash mantienen UTF-8 ya que funciona correctamente en Linux/Mac
3. **Foundry:** Scripts buscan automáticamente en ubicaciones estándar de Foundry
4. **Limpieza:** Al presionar Ctrl+C, ambos scripts limpian procesos automáticamente
5. **Logs:** Anvil escribe logs en `anvil.log` y errores en `anvil-error.log`

---

## Estado Final

✅ Scripts PowerShell funcionando correctamente
✅ Scripts Bash sincronizados con cambios
✅ Aplicación web iniciando sin errores
✅ Configuración generada correctamente
✅ Scripts de detención funcionando

---

## Referencias

- **Directorio de contratos:** `sc/` (Smart Contracts)
- **Script de deploy:** `sc/script/Deploy.s.sol`
- **Configuración web:** `web/src/contracts/config.ts`
- **Contexto Web3:** `web/src/contexts/Web3Context.tsx`
