# Script completo de pruebas con endpoints correctos

# Configuración
$BASE_URL = "http://localhost:3000"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin123"
$REPORT_FILE = "d:\parking-project\TestSprite\test-report-endpoints-completo.md"

# Crear reporte
$report = @()
$report += "# Reporte Completo de Pruebas de Endpoints"
$report += "Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
$report += ""
$report += "## Resultados de Pruebas"
$report += ""

# Función auxiliar para hacer llamadas
function TestEndpoint($method, $endpoint, $description, $headers = $null, $body = $null) {
    try {
        $params = @{
            Uri = "$BASE_URL$endpoint"
            Method = $method
            ErrorAction = 'Stop'
            ContentType = 'application/json'
        }
        
        if ($headers) { $params['Headers'] = $headers }
        if ($body) { 
            if ($body -is [string]) {
                $params['Body'] = $body
            } else {
                $params['Body'] = $body | ConvertTo-Json
            }
        }
        
        $response = Invoke-RestMethod @params
        return @{
            success = $true
            status = "[OK]"
            response = $response
        }
    } catch {
        return @{
            success = $false
            status = "[FAIL]"
            error = $_.Exception.Message
        }
    }
}

# Test 1: Health Check
$result = TestEndpoint "GET" "/health" "Health Check"
$report += "### 1. Health Check"
$report += "Endpoint: GET /health"
$report += "Resultado: $($result.status)"
if ($result.success) {
    $report += "- Version: $($result.response.version)"
    $report += "- Database: $($result.response.database.status)"
}
$report += ""

# Test 2: Login
$loginBody = @{username=$ADMIN_USER; password=$ADMIN_PASS} | ConvertTo-Json
$result = TestEndpoint "POST" "/api/auth/login" "Login" $null $loginBody
$report += "### 2. Authentication (Login)"
$report += "Endpoint: POST /api/auth/login"
$report += "Resultado: $($result.status)"

if ($result.success) {
    $token = $result.response.data.token
    $report += "- Username: $($result.response.data.user.username)"
    $report += "- Role: $($result.response.data.user.role)"
    $report += "- Token obtained: [OK]"
    
    $headers = @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    
    # Tests con autenticación
    
    # Test 3: Capacidad
    $result = TestEndpoint "GET" "/api/vehicles/capacity" "Capacidad" $headers
    $report += ""
    $report += "### 3. Vehicle Capacity"
    $report += "Endpoint: GET /api/vehicles/capacity"
    $report += "Resultado: $($result.status)"
    if ($result.success) {
        $total = if ($result.response.data.total) { $result.response.data.total } else { "N/A" }
        $occupied = if ($result.response.data.occupied) { $result.response.data.occupied } else { "N/A" }
        $available = if ($result.response.data.available) { $result.response.data.available } else { "N/A" }
        $report += "- Total: $total"
        $report += "- Occupied: $occupied"
        $report += "- Available: $available"
    }
    
    # Test 4: Vehículos Estacionados
    $result = TestEndpoint "GET" "/api/vehicles/parked" "Parked Vehicles" $headers
    $report += ""
    $report += "### 4. Parked Vehicles"
    $report += "Endpoint: GET /api/vehicles/parked"
    $report += "Resultado: $($result.status)"
    if ($result.success) {
        $count = if ($result.response.data.count) { $result.response.data.count } else { "0" }
        $report += "- Total: $count"
    }
    
    # Test 5: Historial
    $result = TestEndpoint "GET" "/api/vehicles/history" "Historial" $headers
    $report += ""
    $report += "### 5. Vehicle History"
    $report += "Endpoint: GET /api/vehicles/history"
    $report += "Resultado: $($result.status)"
    
    # Test 6: Usuarios
    $result = TestEndpoint "GET" "/api/users" "Usuarios" $headers
    $report += ""
    $report += "### 6. User Management"
    $report += "Endpoint: GET /api/users"
    $report += "Resultado: $($result.status)"
    if ($result.success) {
        $count = if ($result.response.data.count) { $result.response.data.count } else { "0" }
        $report += "- Total: $count"
    }
    
    # Test 7: Audit Dashboard (correcto)
    $result = TestEndpoint "GET" "/api/audit/dashboard" "Audit" $headers
    $report += ""
    $report += "### 7. Audit - Dashboard"
    $report += "Endpoint: GET /api/audit/dashboard"
    $report += "Resultado: $($result.status)"
    
    # Test 8: Audit Daily
    $result = TestEndpoint "GET" "/api/audit/daily" "Audit Daily" $headers
    $report += ""
    $report += "### 8. Audit - Daily"
    $report += "Endpoint: GET /api/audit/daily"
    $report += "Resultado: $($result.status)"
    
    # Test 9: Reports Daily
    $result = TestEndpoint "GET" "/api/reports/daily" "Reports" $headers
    $report += ""
    $report += "### 9. Reports - Daily"
    $report += "Endpoint: GET /api/reports/daily"
    $report += "Resultado: $($result.status)"
    
    # Test 10: Insights
    $result = TestEndpoint "GET" "/api/insights/statistics" "Insights" $headers
    $report += ""
    $report += "### 10. Insights - Statistics"
    $report += "Endpoint: GET /api/insights/statistics"
    $report += "Resultado: $($result.status)"
    
} else {
    $report += "[FAIL] Could not obtain token. Authenticated tests will not run."
    $report += "Error: $($result.error)"
}

$report += ""
$report += "---"
$report += "Date: $(Get-Date)"
$report += "Base URL: $BASE_URL"

# Guardar reporte
$report | Out-File -FilePath $REPORT_FILE -Encoding UTF8 -Force

# Mostrar resultado
Write-Output ($report -join "`n")
Write-Output "Report saved in: $REPORT_FILE"
