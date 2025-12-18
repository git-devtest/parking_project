# Script de Pruebas del Backend - TestSprite Manual
# Ejecuta pruebas en los endpoints principales del backend

# Configuración
$BASE_URL = "http://localhost:3000"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin123"
$REPORT_FILE = "d:\parking-project\TestSprite\test-report-manual.md"

# Crear reporte
$report = @()
$report += "# Reporte de Pruebas del Backend - $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
$report += ""
$report += "## Estado del Servidor"
$report += ""

# Test 1: Health Check
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
    $report += "✅ **Health Check**: OK"
    $report += "- Versión: $($health.version)"
    $report += "- Uptime: $($health.uptime)"
    $report += "- BD: $($health.database.status)"
    $report += ""
} catch {
    $report += "❌ **Health Check**: FAILED - $_"
    $report += ""
}

# Test 2: Login
try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST `
        -Body (@{username=$ADMIN_USER; password=$ADMIN_PASS} | ConvertTo-Json) `
        -ContentType 'application/json'
    
    $token = $loginResponse.data.token
    $report += "✅ **Autenticación**: Login exitoso"
    $report += "- Usuario: $($loginResponse.data.user.username)"
    $report += "- Rol: $($loginResponse.data.user.role)"
    $report += ""
    
    $headers = @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
} catch {
    $report += "❌ **Autenticación**: FAILED - $_"
    $report += ""
}

# Test 3: Obtener Capacidad
try {
    $capacity = Invoke-RestMethod -Uri "$BASE_URL/api/vehicles/capacity" -Method GET -Headers $headers
    $report += "✅ **Capacidad del Estacionamiento**: OK"
    $report += "- Total: $($capacity.data.total)"
    $report += "- Ocupados: $($capacity.data.occupied)"
    $report += "- Disponibles: $($capacity.data.available)"
    $report += "- Porcentaje: $($capacity.data.percentage)%"
    $report += ""
} catch {
    $report += "❌ **Capacidad del Estacionamiento**: FAILED - $_"
    $report += ""
}

# Test 4: Vehículos Estacionados
try {
    $parked = Invoke-RestMethod -Uri "$BASE_URL/api/vehicles/parked" -Method GET -Headers $headers
    $report += "✅ **Vehículos Estacionados**: OK"
    $report += "- Total: $($parked.data.count)"
    $report += ""
} catch {
    $report += "❌ **Vehículos Estacionados**: FAILED - $_"
    $report += ""
}

# Test 5: Usuarios
try {
    $users = Invoke-RestMethod -Uri "$BASE_URL/api/users" -Method GET -Headers $headers
    $report += "✅ **Usuarios**: OK"
    $report += "- Total: $($users.data.count)"
    $report += ""
} catch {
    $report += "❌ **Usuarios**: FAILED - $_"
    $report += ""
}

# Test 6: Logs de Auditoría
try {
    $audit = Invoke-RestMethod -Uri "$BASE_URL/api/audit/logs" -Method GET -Headers $headers
    $report += "✅ **Auditoría**: OK"
    if ($audit.data) {
        $report += "- Registros encontrados"
    }
    $report += ""
} catch {
    $report += "❌ **Auditoría**: FAILED - $_"
    $report += ""
}

# Test 7: Entradas de Vehículos (History)
try {
    $history = Invoke-RestMethod -Uri "$BASE_URL/api/vehicles/history" -Method GET -Headers $headers
    $report += "✅ **Historial de Vehículos**: OK"
    $report += "- Registros en historial"
    $report += ""
} catch {
    $report += "❌ **Historial de Vehículos**: FAILED - $_"
    $report += ""
}

# Test 8: Reportes
try {
    $reports = Invoke-RestMethod -Uri "$BASE_URL/api/reports/daily" -Method GET -Headers $headers
    $report += "✅ **Reportes Diarios**: OK"
    $report += ""
} catch {
    $report += "❌ **Reportes Diarios**: FAILED - $_"
    $report += ""
}

# Resumen final
$report += "## Resumen"
$report += ""
$report += "Fecha: $(Get-Date)"
$report += "Base URL: $BASE_URL"
$report += ""

# Guardar reporte
$report | Out-File -FilePath $REPORT_FILE -Encoding UTF8 -Force

# Mostrar en consola
Write-Output ($report -join "`n")
Write-Output "`n✅ Reporte guardado en: $REPORT_FILE"
