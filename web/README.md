# Supply Chain Tracker - Frontend

Frontend de la aplicación de trazabilidad blockchain construido con Next.js, TypeScript, Tailwind CSS y ethers.js.

## 🚀 Setup Inicial

### 1. Instalar dependencias

```bash
cd web
npm install
```

### 2. Configurar la dirección del contrato

**IMPORTANTE:** Antes de ejecutar la aplicación, debes desplegar el smart contract y actualizar la configuración.

#### Desplegar el contrato en Anvil:

```bash
# En una terminal, ejecutar Anvil
cd ../sc
anvil

# En otra terminal, desplegar el contrato
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

#### Actualizar `src/contracts/config.ts`:

Copia la dirección del contrato desplegado y actualiza:

```typescript
export const CONTRACT_CONFIG = {
  address: "0x...", // ← Pegar aquí la dirección del contrato desplegado
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Primera cuenta de Anvil
  abi: SUPPLY_CHAIN_ABI,
};
```

### 3. Configurar MetaMask

1. Agregar red Anvil Local en MetaMask:
   - Network Name: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Importar cuentas de prueba de Anvil:
   - Cuenta Admin (Account #0):
     - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Otras cuentas para testing: Ver en la consola de Anvil

## 🏃 Ejecutar en Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 📁 Estructura del Proyecto

```
web/
├── src/
│   ├── app/                      # Páginas (App Router)
│   │   ├── page.tsx              # Landing / Login / Registro
│   │   ├── layout.tsx            # Layout con Web3Provider
│   │   ├── dashboard/
│   │   ├── tokens/
│   │   ├── transfers/
│   │   ├── admin/users/
│   │   └── profile/
│   ├── components/
│   │   ├── ui/                   # Componentes UI básicos
│   │   ├── Header.tsx
│   │   ├── TokenCard.tsx
│   │   ├── TransferList.tsx
│   │   └── UserTable.tsx
│   ├── contexts/
│   │   └── Web3Context.tsx       # Gestión global de Web3
│   ├── hooks/
│   │   └── useWallet.ts          # Hook de wallet
│   ├── lib/
│   │   └── web3.ts               # Servicios Web3
│   ├── contracts/
│   │   └── config.ts             # ABI y configuración
│   └── types/
│       └── index.ts              # Tipos TypeScript
```

## 🧪 Testing End-to-End

### Flujo completo de prueba:

1. **Conectar como Admin**
   - Importar la cuenta admin en MetaMask
   - Conectar wallet

2. **Registrar usuarios**
   - Cambiar a otra cuenta en MetaMask
   - Solicitar rol (Producer, Factory, Retailer, Consumer)
   - Volver a cuenta admin
   - Ir a `/admin/users` y aprobar

3. **Crear tokens (como Producer)**
   - Ir a `/tokens/create`
   - Crear token: "Café Verde", supply: 1000

4. **Transferir tokens**
   - Producer → Factory: 500 unidades
   - Factory acepta en `/transfers`
   - Factory → Retailer: 200 unidades
   - Retailer acepta
   - Retailer → Consumer: 50 unidades
   - Consumer acepta

5. **Ver trazabilidad**
   - Verificar historial en `/transfers`
   - Ver balances en `/tokens`

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar build
npm start

# Lint
npm run lint
```

## ⚙️ Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **ethers.js v6** - Interacción con Ethereum
- **React Hooks** - Gestión de estado

## 🔐 Seguridad

- Nunca compartas las private keys de cuentas reales
- Las cuentas de Anvil son solo para desarrollo local
- No usar en producción sin auditoría de seguridad

## 📝 Notas Importantes

- El contrato debe estar desplegado en Anvil antes de ejecutar el frontend
- Asegúrate de estar en la red correcta (chainId 31337)
- La primera cuenta de Anvil siempre es el admin del contrato
- Los usuarios deben ser aprobados por el admin antes de poder operar

## 🐛 Troubleshooting

### Error: "MetaMask no está instalado"
- Instalar [MetaMask](https://metamask.io/)

### Error: "Red incorrecta"
- Cambiar a la red Anvil Local en MetaMask

### Error: "User not approved"
- El usuario debe ser aprobado por el admin en `/admin/users`

### Transacción revertida
- Verificar que el usuario tiene status "Approved"
- Verificar balance suficiente de tokens
- Verificar que el flujo de roles es correcto (Producer → Factory → Retailer → Consumer)

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de ethers.js](https://docs.ethers.org/v6/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Tailwind CSS](https://tailwindcss.com/docs)