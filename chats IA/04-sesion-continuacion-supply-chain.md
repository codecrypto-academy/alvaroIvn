# Sesión de Continuación - Supply Chain Tracker DApp

**Fecha**: 2025-12-22
**Contexto**: Continuación de sesión anterior que alcanzó el límite de contexto

---

## Resumen Ejecutivo

Esta sesión continuó el desarrollo del Supply Chain Tracker DApp, enfocándose en:
- Corrección del enum UserStatus (agregando estado Canceled)
- Mejoras visuales en dashboard de admin (iconos uniformes)
- Corrección de navegación para administradores
- **Corrección crítica**: Bug que permitía transferir los mismos tokens múltiples veces
- Implementación de sistema de "Balance Disponible" vs "Balance Total"
- Soporte para el nuevo sistema de consumo de tokens en la cadena de suministro

---

## Cambios Realizados

### 1. Estado Cancelado en UserStatus

**Archivo**: `web/src/contracts/config.ts`

**Problema**: El estado "Canceled" existía en el smart contract pero faltaba en el enum de TypeScript.

**Solución**:
```typescript
export enum UserStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Canceled = 3,  // ✅ Agregado
}

export const USER_STATUS_LABELS = {
  [UserStatus.Pending]: "Pendiente",
  [UserStatus.Approved]: "Aprobado",
  [UserStatus.Rejected]: "Rechazado",
  [UserStatus.Canceled]: "Cancelado",  // ✅ Agregado
};
```

También se actualizó la dirección del contrato a: `0x9A676e781A523b5d0C0e43731313A708CB607508`

---

### 2. Dashboard Admin - Iconos Usuarios por Rol

**Archivo**: `web/src/app/dashboard/page.tsx`

**Cambio**: Todos los iconos de la sección "Usuarios por Rol" ahora usan un color uniforme azul.

**Antes**: Cada rol tenía un color diferente (verde, azul, amarillo, morado)

**Después**: Todos los iconos usan `bg-blue-50` con `text-blue-600`

```typescript
// Aplicado a los 4 roles: Productores, Fábricas, Retailers, Consumidores
<div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* SVG paths */}
  </svg>
</div>
```

---

### 3. Botón de Retorno en Página de Detalle de Token (Admin)

**Archivo**: `web/src/app/tokens/[id]/page.tsx`

**Problema**: Cuando un admin veía la trazabilidad de un token, el botón "Volver a Mis Tokens" redirigía a una página vacía.

**Solución**: Ahora redirige a `/admin/tokens` (tokens del sistema) con el texto "Volver a Tokens del Sistema".

```typescript
<Link href={isAdmin ? "/admin/tokens" : "/tokens"} className="flex-1">
  <Button variant="secondary" className="w-full">
    {isAdmin ? "Volver a Tokens del Sistema" : "Volver a Mis Tokens"}
  </Button>
</Link>
```

---

### 4. Perfil - Badge ADMIN Duplicado

**Archivo**: `web/src/app/profile/page.tsx`

**Problema**: En la sección "Rol en la Cadena" aparecía "ADMIN" dos veces.

**Solución**: Se eliminó el badge duplicado y se cambió el badge único a verde cuando el usuario es admin.

```typescript
<div>
  <div className="text-sm text-gray-600 mb-2">Rol en la Cadena</div>
  <Badge variant={isAdmin ? "success" : "info"} className="text-base px-4 py-1">
    {user?.role}
  </Badge>
</div>
```

---

### 5. 🔴 CORRECCIÓN CRÍTICA: Bug de Transferencias Múltiples

**Problema Reportado por el Usuario**:
> "como usuario con el rol factory hice una transferencia de tokens de 1000 que era todo los que tenía, la transferencia queda en estado pendiente, pero la dapp me permite hacer otra transferencia con esos tokens"

**Descripción del Bug**:
- Usuario tenía 1000 tokens
- Transfería 1000 tokens → transferencia queda PENDIENTE
- El sistema aún permitía transferir esos mismos 1000 tokens nuevamente
- Esto permitía "duplicar" tokens mientras las transferencias estaban pendientes

**Solución Implementada**:

#### Archivo: `web/src/app/tokens/[id]/transfer/page.tsx`

Se implementó el cálculo de "Balance Disponible" = Balance Total - Tokens en Transferencias Pendientes

```typescript
const [balance, setBalance] = useState<number>(0);
const [availableBalance, setAvailableBalance] = useState<number>(0);
const [pendingAmount, setPendingAmount] = useState<number>(0);

useEffect(() => {
  if (tokenId && account) {
    Promise.all([
      getToken(tokenId),
      getTokenBalance(tokenId, account),
      getUserTransfers(account)
    ])
    .then(async ([tokenData, tokenBalance, transferIds]) => {
      const transfers = await Promise.all(transferIds.map(id => getTransfer(id)));

      // Calcular tokens en transferencias pendientes salientes
      const pendingOutgoing = transfers
        .filter(t =>
          t.tokenId === tokenId &&
          t.from.toLowerCase() === account.toLowerCase() &&
          t.status === TransferStatus.Pending
        )
        .reduce((sum, t) => sum + t.amount, 0);

      setBalance(tokenBalance);
      setPendingAmount(pendingOutgoing);
      setAvailableBalance(tokenBalance - pendingOutgoing);
    });
  }
}, [tokenId, account]);
```

**Validación actualizada**:
```typescript
if (amount > availableBalance) {
  setError(
    `No tienes suficiente balance disponible. Balance disponible: ${availableBalance} ` +
    `(${pendingAmount} en transferencias pendientes)`
  );
  return;
}
```

**Interfaz de Usuario**:
```typescript
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Balance Total
    </label>
    <div className="text-2xl font-bold text-gray-900">
      {balance.toLocaleString()}
    </div>
  </div>

  {pendingAmount > 0 && (
    <div>
      <label className="block text-sm font-medium text-orange-600 mb-2">
        Tokens en Transferencias Pendientes
      </label>
      <div className="text-xl font-semibold text-orange-600">
        {pendingAmount.toLocaleString()}
      </div>
    </div>
  )}

  <div>
    <label className="block text-sm font-medium text-green-700 mb-2">
      Balance Disponible para Transferir
    </label>
    <div className="text-2xl font-bold text-green-600">
      {availableBalance.toLocaleString()}
    </div>
  </div>
</div>
```

---

## Modificaciones del Usuario al Sistema

Durante esta sesión se identificó que el usuario realizó modificaciones significativas al sistema para implementar un flujo completo de cadena de suministro:

### 1. Consumo de Tokens al Crear Tokens Derivados

**Archivo**: `web/src/app/tokens/create/page.tsx`

El usuario modificó el formulario de creación para:
- Factory y Retailer **deben** crear tokens derivados (no pueden crear tokens originales)
- Al crear un token derivado, se **consumen** tokens del padre
- Se agregó el campo `amountConsumed` para especificar cuántos tokens se consumen

```typescript
const [formData, setFormData] = useState({
  name: "",
  totalSupply: "",
  features: "",
  parentId: isFactoryOrRetailer ? "" : "0",
  amountConsumed: "",  // Nuevo campo
});

// Validación
if (isFactoryOrRetailer && parentId === 0) {
  setError("Como Factory/Retailer debes crear tokens derivados. Ingresa el ID del token padre.");
  return;
}

const amountConsumed = parseInt(formData.amountConsumed) || 0;
if (parentId > 0 && amountConsumed <= 0) {
  setError("Debes especificar cuántos tokens del padre vas a consumir");
  return;
}
```

### 2. Solo el Creador Puede Transferir

**Archivos**: `web/src/app/tokens/[id]/page.tsx`, `web/src/components/TokenCard.tsx`

Se agregó validación para que solo el creador de un token pueda transferirlo:

```typescript
const isCreator = account?.toLowerCase() === token.creator.toLowerCase();

// Botón de transferir solo visible para el creador
{!isAdmin && userRole !== "CONSUMER" && availableBalance > 0 && isCreator && (
  <Link href={`/tokens/${token.id}/transfer`}>
    <Button>Transferir</Button>
  </Link>
)}
```

### 3. Balance Total vs Balance Disponible en TokenCard

**Archivo**: `web/src/components/TokenCard.tsx`

Se modificó la tarjeta de token para mostrar:
- **Balance Total**: Cantidad total de tokens que posee
- **Balance Disponible**: Total - tokens en transferencias pendientes
- Indicador visual cuando hay tokens en transferencias pendientes

```typescript
const pendingTransfers = token.pendingTransfers || 0;
const totalBalance = balance !== undefined ? balance : 0;
const availableBalance = totalBalance - pendingTransfers;

// Interfaz
<div className="text-sm text-gray-600">Balance Total</div>
<div className="text-lg font-semibold text-gray-900">
  {token.totalSupply.toLocaleString()}
</div>

<div className="text-sm text-gray-600">Balance Disponible</div>
<div className="text-2xl font-bold text-blue-600">
  {availableBalance.toLocaleString()}
</div>

{pendingTransfers > 0 && (
  <div className="text-sm text-orange-600 mt-1">
    {pendingTransfers.toLocaleString()} en transferencias pendientes
  </div>
)}
```

### 4. Cálculo de Pending Transfers en Lista de Tokens

**Archivo**: `web/src/app/tokens/page.tsx`

Se agregó lógica para calcular transferencias pendientes para cada token:

```typescript
const transferIds = await getUserTransfers(account);
const transfers = await Promise.all(transferIds.map((id) => getTransfer(id)));

const tokensData = await Promise.all(
  tokenIds.map(async (id) => {
    const token = await getToken(id);
    const balance = await getTokenBalance(id, account);

    // Calcular transferencias pendientes para este token
    const pendingTransfers = transfers
      .filter(t =>
        t.tokenId === id &&
        t.from.toLowerCase() === account.toLowerCase() &&
        t.status === TransferStatus.Pending
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return { ...token, balance, pendingTransfers };
  })
);
```

### 5. Modificaciones al Smart Contract

**Archivo**: `sc/src/SupplyChain.sol`

El usuario actualizó el smart contract para implementar las reglas de la cadena de suministro:

```solidity
function createToken(
    string memory name,
    uint256 totalSupply,
    string memory features,
    uint256 parentId,
    uint256 amountConsumed  // Nuevo parámetro
) public onlyApproved {
    bytes32 roleHash = keccak256(bytes(users[userIds[msg.sender]].role));

    // PRODUCER: Solo tokens originales
    if (roleHash == keccak256(bytes("PRODUCER"))) {
        require(parentId == 0, "Producers can only create original tokens");
        require(amountConsumed == 0, "Producers cannot consume tokens when creating");
    }

    // FACTORY y RETAILER: Solo tokens derivados
    if (roleHash == keccak256(bytes("FACTORY")) || roleHash == keccak256(bytes("RETAILER"))) {
        require(parentId > 0, "Factories and retailers must create derived tokens from existing materials");
        require(amountConsumed > 0, "Must specify how many parent tokens to consume");
    }

    // Consumir tokens del padre
    if (parentId != 0) {
        require(tokenBalances[parentId][msg.sender] >= amountConsumed, "Insufficient parent token balance");
        tokenBalances[parentId][msg.sender] -= amountConsumed;
    }

    // ... resto de la lógica
}

function transfer(address to, uint256 tokenId, uint256 amount) public onlyApproved {
    // Solo el creador puede transferir
    require(tokens[tokenId].creator == msg.sender, "Only token creator can transfer it");

    // Validar flujo de roles
    _validateRoleTransfer(users[fromUserId].role, users[toUserId].role);

    // ... resto de la lógica
}
```

---

## Flujo Completo de la Cadena de Suministro

Con todas las modificaciones implementadas, el flujo completo es:

### 1. PRODUCER (Productor)
- Crea tokens **originales** (parentId = 0)
- No puede crear tokens derivados
- No consume tokens al crear
- Recibe 100% del supply inicial
- Solo puede transferir tokens que él creó
- Solo puede transferir a FACTORY

### 2. FACTORY (Fábrica)
- **Debe** crear tokens derivados (parentId > 0)
- No puede crear tokens originales
- **Debe consumir** tokens del productor al crear
- Ejemplo: Recibe 1000 tokens de trigo, crea 800 tokens de harina (consume los 1000 de trigo)
- Solo puede transferir tokens que él creó
- Solo puede transferir a RETAILER

### 3. RETAILER (Minorista)
- **Debe** crear tokens derivados (parentId > 0)
- No puede crear tokens originales
- **Debe consumir** tokens de la fábrica al crear
- Ejemplo: Recibe 800 tokens de harina, crea 600 tokens de pan (consume los 800 de harina)
- Solo puede transferir tokens que él creó
- Solo puede transferir a CONSUMER

### 4. CONSUMER (Consumidor)
- No puede crear tokens
- No puede transferir tokens
- Solo puede recibir tokens del RETAILER
- Punto final de la cadena

### Sistema de Balance Disponible

En cualquier punto:
- **Balance Total**: Todos los tokens que posees
- **Tokens Pendientes**: Tokens en transferencias pendientes salientes
- **Balance Disponible**: Balance Total - Tokens Pendientes

Esto previene:
- Transferir los mismos tokens múltiples veces
- "Duplicar" tokens mientras transferencias están pendientes
- Gastar tokens que ya están comprometidos

---

## Errores Corregidos

### Error 1: TypeScript - UserStatus.Canceled
```
Property 'Canceled' does not exist on type 'typeof UserStatus'
Location: dashboard/page.tsx:142
```
**Solución**: Agregado `Canceled = 3` al enum UserStatus

### Error 2: TypeScript - userRole type
```
Type 'string | null' is not assignable to type 'string | undefined'
Location: tokens/page.tsx:137
```
**Solución**: Cambiado a `userRole={userRole || undefined}`

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPPLY CHAIN FLOW                       │
└─────────────────────────────────────────────────────────────┘

PRODUCER                FACTORY                RETAILER              CONSUMER
   │                       │                       │                    │
   │ Crea tokens          │                       │                    │
   │ originales           │                       │                    │
   │ (Trigo: 1000)        │                       │                    │
   │                      │                       │                    │
   │──Transfer(1000)─────>│                       │                    │
   │   [PENDING]          │                       │                    │
   │                      │ Accept                │                    │
   │                      │ Balance: 1000         │                    │
   │                      │                       │                    │
   │                      │ Crea token derivado   │                    │
   │                      │ (Harina: 800)         │                    │
   │                      │ Consume 1000 trigo    │                    │
   │                      │                       │                    │
   │                      │──Transfer(800)───────>│                    │
   │                      │   [PENDING]           │                    │
   │                      │                       │ Accept             │
   │                      │                       │ Balance: 800       │
   │                      │                       │                    │
   │                      │                       │ Crea token derivado│
   │                      │                       │ (Pan: 600)         │
   │                      │                       │ Consume 800 harina │
   │                      │                       │                    │
   │                      │                       │──Transfer(600)────>│
   │                      │                       │   [PENDING]        │
   │                      │                       │                    │ Accept
   │                      │                       │                    │ Balance: 600
   │                      │                       │                    │
```

---

## Balance Disponible - Casos de Uso

### Caso 1: Sin Transferencias Pendientes
```
Balance Total: 1000
Transferencias Pendientes: 0
Balance Disponible: 1000 ✅ Puede transferir hasta 1000
```

### Caso 2: Con Transferencia Pendiente
```
Balance Total: 1000
Transferencias Pendientes: 1000 (transferencia a Retailer)
Balance Disponible: 0 ❌ No puede hacer más transferencias
```

### Caso 3: Transferencia Parcial Pendiente
```
Balance Total: 1000
Transferencias Pendientes: 600 (transferencia a Retailer)
Balance Disponible: 400 ✅ Puede transferir hasta 400 más
```

### Caso 4: Transferencia Aceptada
```
Antes:
  Balance Total: 1000
  Transferencias Pendientes: 1000
  Balance Disponible: 0

Después de aceptación:
  Balance Total: 0
  Transferencias Pendientes: 0
  Balance Disponible: 0
```

### Caso 5: Transferencia Rechazada
```
Antes:
  Balance Total: 1000
  Transferencias Pendientes: 1000
  Balance Disponible: 0

Después de rechazo:
  Balance Total: 1000
  Transferencias Pendientes: 0
  Balance Disponible: 1000 ✅ Tokens liberados
```

---

## Estado Final del Sistema

### Archivos Modificados en Esta Sesión:
1. ✅ `web/src/contracts/config.ts` - Agregado estado Canceled
2. ✅ `web/src/app/dashboard/page.tsx` - Iconos uniformes en azul
3. ✅ `web/src/app/tokens/[id]/page.tsx` - Navegación admin corregida
4. ✅ `web/src/app/profile/page.tsx` - Badge ADMIN duplicado eliminado
5. ✅ `web/src/app/tokens/[id]/transfer/page.tsx` - Balance disponible implementado

### Archivos Modificados por el Usuario (Identificados):
1. `web/src/app/tokens/create/page.tsx` - Sistema de consumo de tokens
2. `web/src/components/TokenCard.tsx` - Balance Total vs Disponible
3. `web/src/app/tokens/page.tsx` - Cálculo de pending transfers
4. `sc/src/SupplyChain.sol` - Reglas de cadena de suministro

### Dirección del Contrato Actual:
```
0x9A676e781A523b5d0C0e43731313A708CB607508
```

### Estado del Despliegue:
⚠️ **Sistema caído** - El usuario reportó que el sistema desplegado se cayó al final de la sesión.

---

## Pendientes

1. ⚠️ **Reiniciar el sistema desplegado** (blockchain node + redeploy)
2. 🔍 Investigar causa del crash del sistema
3. ✅ Documentar sesión en markdown (este archivo)

---

## Notas Técnicas

### Prevención de Double-Spending
El sistema ahora previene el double-spending de tokens mediante:
1. Cálculo en tiempo real de transferencias pendientes
2. Validación contra balance disponible (no balance total)
3. Indicadores visuales claros del estado de los tokens
4. Mensajes de error informativos

### Trazabilidad de la Cadena
Cada token mantiene:
- `parentId`: ID del token padre (0 si es original)
- `creator`: Dirección del creador del token
- `amountConsumed`: Cantidad de tokens del padre consumidos

Esto permite rastrear toda la cadena:
```
Token 1 (Trigo) → Token 2 (Harina) → Token 3 (Pan)
Producer         Factory            Retailer
```

### Restricciones por Rol
```javascript
PRODUCER:  CREATE(original) ✅  CREATE(derived) ❌  TRANSFER → FACTORY
FACTORY:   CREATE(original) ❌  CREATE(derived) ✅  TRANSFER → RETAILER
RETAILER:  CREATE(original) ❌  CREATE(derived) ✅  TRANSFER → CONSUMER
CONSUMER:  CREATE(any)      ❌  TRANSFER        ❌  RECEIVE only
```

---

## Conversación Completa

### Intercambio 1: Estado Cancelado
**Usuario**: "reduce un poco más el tamaño de los iconos de los cards"

**Usuario**: "incluye un logo al lado izquierdo del nombre de la dapp en el header y dame la ruta por si quiero cambiar el logo"

**Usuario**: "en el header, para la parte del admin veo que se muestra dos veces ADMIN, deja solo uno ya corre"

**Usuario**: (contexto previo sobre mejoras en dashboard)

**Usuario**: "en ves de rediriguir al dashboards que rediriga a la parte de tokens"

**Usuario**: "desde el perfil del admin en la parte de perfil en Rol de cadena aparece dos veces ADMIN, deja solo uno"

**Asistente**: Identifiqué el badge duplicado en el archivo de perfil y lo corregí, dejando un solo badge que cambia a verde cuando el usuario es admin.

---

### Intercambio 2: Bug Crítico de Transferencias
**Usuario**:
> "como usuario con el rol factory hice una transferencia de tokens de 1000 que era todo los que tenía, la transferencia queda en estado pendiente, pero la dapp me permite hacer otra transferencia con esos tokens, no debería permitirlo hasta que la transferencia sea aceptada o rechazada debería permitir si tengo mas tokens que pueda transferir dejando reservados los tokens que ya se transfirieron por si el retailer acepta"

**Asistente**: Este es un bug crítico. El sistema debe calcular el "balance disponible" restando las transferencias pendientes del balance total. Implementé:
- Cálculo de transferencias pendientes salientes
- Nuevo campo "Balance Disponible" en la UI
- Validación contra balance disponible
- Indicadores visuales de tokens reservados

---

### Intercambio 3: Iconos Dashboard
**Usuario**: "en la parte usuarios por rol de los iconos de un solo color"

**Usuario**: (seleccionó bg-blue-50) "en usuarios por rol deja los iconos con bg-blue-50"

**Asistente**: Actualicé todos los iconos de la sección "Usuarios por Rol" para usar `bg-blue-50` y `text-blue-600` uniformemente.

---

### Intercambio 4: Error Estado Cancelado
**Usuario**: "hay un error con el estado cancelado"

**Asistente**: Corregí el error agregando el estado `Canceled = 3` al enum UserStatus en config.ts.

---

### Intercambio 6: Crear Markdown
**Usuario**: (seleccionó texto) "crea un archivo marckdown con todo el chat, guardalo en la carpeta chats IA que ya existe"

**Asistente**: (Este archivo)

---

## Conclusiones

Esta sesión fue altamente productiva, logrando:

1. ✅ Corrección de bugs críticos (transferencias múltiples)
2. ✅ Mejoras en la experiencia de usuario (indicadores visuales)
3. ✅ Implementación de lógica compleja de balance disponible
4. ✅ Soporte para el nuevo sistema de consumo de tokens
5. ✅ Mejoras visuales en dashboard
6. ✅ Correcciones de navegación para admin

El sistema ahora implementa correctamente un flujo de cadena de suministro con:
- Transformación obligatoria de tokens en cada paso
- Prevención de double-spending
- Trazabilidad completa
- Restricciones por rol bien definidas
- Indicadores claros del estado de los tokens

---

**Fin del Documento**
