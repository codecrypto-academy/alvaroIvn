# Script PowerShell para detener todos los servicios del proyecto

Write-Host "Deteniendo Supply Chain Tracker..." -ForegroundColor Yellow

# Detener Anvil
$anvilProcesses = Get-Process -Name "anvil" -ErrorAction SilentlyContinue
if ($anvilProcesses) {
    $anvilProcesses | Stop-Process -Force
    Write-Host "[OK] Anvil detenido" -ForegroundColor Green
} else {
    Write-Host "  Anvil no estaba ejecutandose" -ForegroundColor Gray
}

# Detener Next.js (procesos de node en puerto 3000)
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*3000*" -or
    (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue | Where-Object LocalPort -eq 3000)
}

if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "[OK] Next.js detenido" -ForegroundColor Green
} else {
    Write-Host "  Next.js no estaba ejecutandose" -ForegroundColor Gray
}

# Detener procesos de cmd.exe que puedan haber quedado del npm run dev
$cmdProcesses = Get-Process -Name "cmd" -ErrorAction SilentlyContinue
if ($cmdProcesses) {
    $cmdProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Limpiar archivos de log
Remove-Item -Path "anvil.log", "anvil-error.log" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[OK] Todos los servicios han sido detenidos" -ForegroundColor Green
