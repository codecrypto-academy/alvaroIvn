# Testing Documentation - Supply Chain Tracker

Documentación completa de tests implementados para el proyecto.

## 📊 Resumen de Cobertura

### Tests Implementados

#### ✅ Componentes UI (6/6 - 100%)
- **Button.test.tsx** - 15 tests ✅
- **Badge.test.tsx** - 9 tests ✅
- **Card.test.tsx** - 17 tests ✅
- **Alert.test.tsx** - 9 tests ✅
- **Input.test.tsx** - 28 tests ✅
- **Select.test.tsx** - 21 tests ✅

#### ✅ Hooks (1/1)
- **useWallet.test.tsx** - 15 tests ✅

#### ✅ Componentes de Páginas (3/3 - 100%)
- **Header.test.tsx** - 32 tests ✅
- **TransferList.test.tsx** - 22 tests ✅
- **UserTable.test.tsx** - 28 tests ✅

#### ✅ Tests de Integración (1)
- **TokenCard.integration.test.tsx** - 20 tests ✅

#### ✅ Tests de Accesibilidad (1)
- **ui-accessibility.test.tsx** - 15 tests ✅
  - Tests con axe-core para WCAG 2.1
  - Cobertura de todos los componentes UI

#### ✅ Tests de Performance (1)
- **render-performance.test.tsx** - 11 tests ✅
  - Métricas de rendering para componentes clave
  - Tests de re-render y múltiples componentes
  - Detección de memory leaks

#### ✅ Tests End-to-End (1)
- **homepage.spec.ts** (Playwright) - 3 tests ✅
  - Tests multi-navegador (Chromium, Firefox, WebKit)
  - Tests responsive (Desktop + Mobile)

#### ✅ Tests de Seguridad (1)
- **security.test.tsx** - 17 tests ✅
  - Protección XSS (Cross-Site Scripting)
  - Sanitización de inputs
  - Validación de direcciones Ethereum
  - Protección contra inyección JSON
  - Manejo de integer overflow

#### ✅ Tests de Utilidades Web3 (1)
- **web3-utils.test.ts** - 38 tests ✅
  - formatDate: Formateo de timestamps
  - parseFeatures: Parsing seguro de JSON
  - isValidAddress: Validación de direcciones Ethereum

#### ✅ Tests de Context (1)
- **Web3Context.test.tsx** - 17 tests ✅
  - Provider initialization
  - Context hook (useWeb3Context)
  - Error handling
  - Type safety
  - Memory leak prevention

### Total: **304 tests implementados - ✅ Todos pasando**
**Test Suites:** 16 passed, 16 total

## 🚀 Scripts Disponibles

```bash
# Ejecutar tests unitarios/integración (Jest)
npm test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar tests End-to-End (Playwright)
npm run test:e2e

# Ejecutar tests E2E con interfaz visual
npm run test:e2e:ui

# Ejecutar tests E2E en modo headed (ver navegador)
npm run test:e2e:headed

# Ejecutar todos los tests (Jest + Playwright)
npm run test:all
```

## 📁 Estructura de Tests

```
web/
├── e2e/                                    # Tests End-to-End (Playwright)
│   └── homepage.spec.ts
├── playwright.config.ts                    # Configuración Playwright
└── src/
    ├── components/
    │   ├── ui/
    │   │   └── __tests__/
    │   │       ├── Alert.test.tsx
    │   │       ├── Badge.test.tsx
    │   │       ├── Button.test.tsx
    │   │       ├── Card.test.tsx
    │   │       ├── Input.test.tsx
    │   │       ├── Select.test.tsx
    │   │       ├── accessibility/
    │   │       │   └── ui-accessibility.test.tsx
    │   │       └── README.md
    │   └── __tests__/
    │       ├── Header.test.tsx
    │       ├── TransferList.test.tsx
    │       ├── UserTable.test.tsx
    │       ├── TokenCard.integration.test.tsx
    │       └── performance/
    │           └── render-performance.test.tsx
    └── hooks/
        └── __tests__/
            └── useWallet.test.tsx
```

## 🧪 Detalles de Tests por Componente

### 1. Button Component (15 tests)
Tests completos para todas las variantes, tamaños, estados y eventos:
- ✅ Renderizado con children
- ✅ Variantes: primary, secondary, danger, success, warning
- ✅ Tamaños: sm, md, lg
- ✅ Estados: disabled, loading
- ✅ Manejo de eventos click
- ✅ Clases personalizadas

### 2. Badge Component (9 tests)
Tests para todas las variantes y estilos:
- ✅ Renderizado con children
- ✅ Variantes: default, success, warning, danger, info
- ✅ Aplicación de clases base
- ✅ Clases personalizadas

### 3. Card Component (17 tests)
Tests para Card y sus subcomponentes:
- ✅ Card principal (padding, estilos, clases)
- ✅ CardHeader (renderizado, estilos)
- ✅ CardTitle (renderizado como h3, estilos)
- ✅ CardContent (padding, estilos)
- ✅ Composición completa

### 4. Alert Component (9 tests)
Tests de accesibilidad y variantes:
- ✅ Renderizado con children
- ✅ Role de accesibilidad (alert)
- ✅ Variantes: info, success, warning, error
- ✅ Children complejos
- ✅ Clases base y personalizadas

### 5. Input Component (28 tests)
Tests completos para Input y Textarea:
- ✅ Renderizado con/sin label
- ✅ Manejo de errores y estilos
- ✅ Diferentes tipos (text, email, password, number)
- ✅ Estados: disabled, required
- ✅ Eventos onChange
- ✅ Valores controlados y no controlados
- ✅ Prevención de wheel en inputs numéricos
- ✅ Textarea con todas sus variantes

### 6. Select Component (21 tests)
Tests completos para dropdown:
- ✅ Renderizado de opciones
- ✅ Con/sin label
- ✅ Manejo de errores
- ✅ Selección de valores
- ✅ Eventos onChange
- ✅ Estados: disabled, required
- ✅ Valores controlados y no controlados
- ✅ Select múltiple

### 7. useWallet Hook (15 tests)
Tests para el hook de wallet:
- ✅ Retorno de valores del contexto
- ✅ Funciones connect/disconnect
- ✅ Formateo de direcciones
- ✅ Detección de cuenta admin
- ✅ Carga de rol de usuario
- ✅ Manejo de estados de carga
- ✅ Manejo de errores
- ✅ Reseteo al desconectar

### 8. TokenCard Integration (20 tests)
Tests de integración del componente TokenCard:
- ✅ Renderizado completo con todos los subcomponentes
- ✅ Display de balances y transferencias pendientes
- ✅ Badges de tokens derivados
- ✅ Lógica condicional de botones según rol
- ✅ Verificación de permisos (admin, consumer, creator)
- ✅ Links correctos a páginas de detalle
- ✅ Formateo de direcciones
- ✅ Display de características

### 9. Header Component (32 tests)
Tests completos del componente de navegación:
- ✅ Estados de conexión (conectado/desconectado)
- ✅ Navegación según rol (admin vs usuario regular)
- ✅ Menú móvil responsive con hamburguesa
- ✅ Display de información del usuario (dirección, rol, estado)
- ✅ Advertencia de red incorrecta
- ✅ Carga asíncrona de información de usuario
- ✅ Manejo de errores de carga
- ✅ Accesibilidad (ARIA attributes)

### 10. TransferList Component (22 tests)
Tests del listado de transferencias:
- ✅ Estado vacío
- ✅ Renderizado de tabla con datos
- ✅ Identificación de remitente/receptor con badges
- ✅ Estados de transferencia (pendiente, aceptada, rechazada)
- ✅ Botones de acción según permisos
- ✅ Callbacks de aceptar/rechazar
- ✅ Estado de carga (botones deshabilitados)
- ✅ Formateo de direcciones y cantidades
- ✅ Comparación case-insensitive de direcciones

### 11. UserTable Component (28 tests)
Tests de la tabla de administración de usuarios:
- ✅ Estado vacío
- ✅ Renderizado de usuarios
- ✅ Display de estados (aprobado, pendiente, rechazado, cancelado)
- ✅ Protección del usuario admin principal
- ✅ Botones de acción según estado del usuario
- ✅ Callbacks de aprobar/rechazar/cancelar
- ✅ Estado de carga
- ✅ Formateo de direcciones
- ✅ Comparación case-insensitive de direcciones

## 🛠️ Tecnologías Utilizadas

- **Jest** v30.2.0 - Framework de testing
- **React Testing Library** v16.3.1 - Testing de componentes React
- **@testing-library/user-event** v14.6.1 - Simulación de interacciones
- **@testing-library/jest-dom** v6.9.1 - Matchers personalizados
- **@types/jest** - Tipos de TypeScript para Jest

## 📋 Mejores Prácticas Aplicadas

1. **Consultas Accesibles**: Uso preferente de `getByRole`, `getByLabelText`
2. **Testing de Comportamiento**: Enfoque en lo que el usuario ve y hace
3. **Cobertura Completa**: Tests para todas las variantes y estados
4. **Tests Descriptivos**: Nombres claros que explican el comportamiento
5. **Aislamiento**: Tests independientes sin dependencias entre ellos
6. **Mocking Apropiado**: Mocks de módulos externos (Next.js, web3)

## 🎯 Estadísticas

```
Test Suites: 11 passed, 11 total
Tests:       203 passed, 203 total
Snapshots:   0 total
Coverage:
  - Components UI: 100% (6/6)
  - Hooks: 100% (1/1)
  - Page Components: 100% (3/3)
  - Integration: 1 test suite
```

## 🔄 Integración Continua

Los tests están configurados para ejecutarse antes del build:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm test && npm run test:e2e"
  }
}
```

### 9. Tests de Accesibilidad (15 tests)

Tests automatizados con **jest-axe** y **axe-core** para verificar cumplimiento WCAG 2.1:

**Cobertura:**
- ✅ Button: variantes, estados disabled
- ✅ Badge: todas las variantes
- ✅ Card: estructura y subcomponentes
- ✅ Alert: roles ARIA y variantes
- ✅ Input: labels, aria-describedby, estados required
- ✅ Textarea: labels y aria-describedby
- ✅ Select: labels y asociación correcta

**Verificaciones:**
- Contraste de colores
- Roles ARIA apropiados
- Labels asociados correctamente
- Estructura semántica
- Navegación por teclado

### 10. Tests de Performance (11 tests)

Tests de métricas de renderizado usando `performance.now()`:

**Componentes medidos:**
- ✅ TokenCard: render inicial y re-render
- ✅ TransferList: 10 items, 50 items, estado vacío
- ✅ UserTable: 10 users, 50 users, cambios de estado loading
- ✅ Renderizado múltiple: 3 TokenCards simultáneos
- ✅ Detección de memory leaks: 2 tests

**Métricas típicas:**
- TokenCard inicial: ~200ms
- TokenCard re-render: ~11ms
- TransferList (50 items): ~424ms
- UserTable (50 items): ~236ms

Nota: Los tests usan logging para monitoreo, no thresholds estrictos (compatibilidad con diferentes entornos).

### 11. Tests End-to-End (3 tests)

Tests E2E con **Playwright** en múltiples navegadores:

**Navegadores:**
- Chromium (Desktop Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

**Cobertura:**
- ✅ Homepage: título, elementos principales
- ✅ Responsive: Mobile vs Desktop
- ✅ Accesibilidad básica: navegación, headings, alt text

## 📝 Próximas Mejoras

- [ ] Tests E2E para flujos completos de usuario (crear token, transferir)
- [ ] Tests de carga de smart contracts
- [ ] Aumentar cobertura a 90%+ con jest --coverage
- [ ] Tests de seguridad (XSS, CSRF)

## 🐛 Notas Conocidas

- Los tests del hook `useWallet` muestran advertencias de `act()` en la consola debido a actualizaciones asíncronas de estado. Estas son advertencias informativas, no errores - todos los tests pasan correctamente.
- Los tests de integración usan mocks de `next/link` y módulos de web3 para aislar la lógica de componentes.
- Los componentes Input, Textarea y Select ahora tienen labels correctamente asociados usando `htmlFor` y `id` únicos para mejorar la accesibilidad.

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Última actualización**: 24/12/2025
**Versión de tests**: 1.0.0
