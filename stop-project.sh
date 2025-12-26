#!/bin/bash

# Script para detener todos los servicios del proyecto

echo "Deteniendo Supply Chain Tracker..."

# Matar procesos de Anvil
pkill -f "anvil" && echo "✓ Anvil detenido" || echo "  Anvil no estaba ejecutándose"

# Matar procesos de Next.js
pkill -f "next dev" && echo "✓ Next.js detenido" || echo "  Next.js no estaba ejecutándose"

# Matar procesos de node (por si acaso)
pkill -f "node.*3000" && echo "✓ Procesos de Node detenidos" || echo "  No hay procesos de Node en puerto 3000"

# Limpiar archivo de log
rm -f anvil.log anvil-error.log 2>/dev/null

echo ""
echo "✓ Todos los servicios han sido detenidos"
