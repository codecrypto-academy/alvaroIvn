# Tests de Componentes UI

Este directorio contiene los tests para los componentes de interfaz de usuario (UI).

## Componentes Testeados

### ✅ Button Component
- **Archivo**: `Button.test.tsx`
- **Cobertura**: 100%
- **Tests**: 15 casos
  - Renderizado con children
  - Variantes (primary, secondary, danger, success, warning)
  - Tamaños (sm, md, lg)
  - Estado disabled
  - Estado loading
  - Manejo de eventos click
  - Clases personalizadas

### ✅ Badge Component
- **Archivo**: `Badge.test.tsx`
- **Cobertura**: 100%
- **Tests**: 9 casos
  - Renderizado con children
  - Variantes (default, success, warning, danger, info)
  - Clases personalizadas
  - Estilos base

### ✅ Card Component
- **Archivo**: `Card.test.tsx`
- **Cobertura**: 100%
- **Tests**: 17 casos
  - Card principal (padding, estilos, clases personalizadas)
  - CardHeader (renderizado, estilos)
  - CardTitle (renderizado como h3, estilos)
  - CardContent (padding, estilos)
  - Composición completa de Card

### ✅ Alert Component
- **Archivo**: `Alert.test.tsx`
- **Cobertura**: 100%
- **Tests**: 9 casos
  - Renderizado con children
  - Role de accesibilidad (alert)
  - Variantes (info, success, warning, error)
  - Estilos base
  - Children complejos

## Ejecutar Tests

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests en modo watch (desarrollo)
```bash
npm run test:watch
```

### Ejecutar tests con cobertura
```bash
npm run test:coverage
```

### ✅ Input Component
- **Archivo**: `Input.test.tsx`
- **Cobertura**: 100%
- **Tests**: 28 casos
  - Input: renderizado, label, errores, tipos, eventos, valores
  - Textarea: renderizado, label, errores, eventos, atributos
  - Prevención de wheel en inputs numéricos

### ✅ Select Component
- **Archivo**: `Select.test.tsx`
- **Cobertura**: 100%
- **Tests**: 21 casos
  - Renderizado de opciones
  - Con/sin label
  - Manejo de errores
  - Selección y eventos
  - Estados y valores controlados

## Estadísticas de Cobertura

### Componentes UI - 100% Cobertura
- ✅ Alert.tsx (100%)
- ✅ Badge.tsx (100%)
- ✅ Button.tsx (100%)
- ✅ Card.tsx (100%)
- ✅ Input.tsx (100%)
- ✅ Select.tsx (100%)

**Total: 99 tests para componentes UI - ✅ Todos pasando**

## Tecnologías Utilizadas

- **Jest**: Framework de testing
- **React Testing Library**: Testing de componentes React
- **@testing-library/user-event**: Simulación de interacciones de usuario
- **@testing-library/jest-dom**: Matchers personalizados para el DOM

## Mejores Prácticas

1. **Usar consultas accesibles**: Preferir `getByRole`, `getByLabelText` sobre `getByTestId`
2. **Testear comportamiento, no implementación**: Enfocarse en lo que el usuario ve y hace
3. **Cobertura completa**: Cada componente debe tener tests para todas sus variantes y estados
4. **Tests descriptivos**: Nombres claros que explican qué se está testeando
5. **Aislamiento**: Cada test debe ser independiente y no depender de otros

## Tareas Completadas ✅

- [x] Agregar tests para Input.tsx (28 tests)
- [x] Agregar tests para Select.tsx (21 tests)
- [x] Agregar tests para hooks personalizados (useWallet - 15 tests)
- [x] Agregar tests de integración (TokenCard - 20 tests)
- [x] Agregar tests para Header.tsx (32 tests)
- [x] Agregar tests para TransferList.tsx (22 tests)
- [x] Agregar tests para UserTable.tsx (28 tests)

## Próximos Pasos

- [ ] Tests end-to-end con Cypress/Playwright
- [ ] Tests de performance
- [ ] Tests de accesibilidad automatizados
