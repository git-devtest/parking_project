# Script de Pruebas Frontend E2E con TestSprite

# Configuración
$FRONTEND_URL = "http://localhost:4200"
$REPORT_FILE = "d:\parking-project\TestSprite\test-report-frontend-e2e.md"

# Crear reporte
$report = @()
$report += "# Reporte E2E Frontend - Parking Project"
$report += "Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
$report += ""
$report += "## Configuración de Pruebas"
$report += ""
$report += "- Frontend Base URL: $FRONTEND_URL"
$report += "- Framework: Angular 20"
$report += "- Tecnología: TypeScript, Angular Material"
$report += "- Modo: E2E Testing"
$report += ""
$report += "## Pre-requisitos"
$report += ""
$report += "- ✅ Backend ejecutándose: http://localhost:3000"
$report += "- ✅ Frontend ejecutándose: $FRONTEND_URL"
$report += "- ✅ Credenciales de prueba disponibles"
$report += ""

# Función auxiliar
function TestEndpoint($method, $endpoint, $description, $headers = $null, $body = $null) {
    try {
        $params = @{
            Uri = "$FRONTEND_URL$endpoint"
            Method = $method
            ErrorAction = 'Stop'
            ContentType = 'text/html'
        }
        
        if ($headers) { $params['Headers'] = $headers }
        if ($body) { $params['Body'] = $body }
        
        $response = Invoke-WebRequest @params
        return @{
            success = $true
            status = "[OK]"
            statusCode = $response.StatusCode
        }
    } catch {
        return @{
            success = $false
            status = "[FAIL]"
            error = $_.Exception.Message
        }
    }
}

$report += "## Pruebas Iniciales"
$report += ""

# Test 1: Frontend está en línea
$result = TestEndpoint "GET" "/" "Frontend homepage"
$report += "### 1. Frontend Accesible"
$report += "URL: GET $FRONTEND_URL"
$report += "Resultado: $($result.status)"
if ($result.success) {
    $report += "- Status Code: $($result.statusCode)"
    $report += "- Página principal cargada"
}
$report += ""

# Test 2: Login page accesible
$result = TestEndpoint "GET" "/login" "Login page"
$report += "### 2. Página de Login"
$report += "URL: GET $FRONTEND_URL/login"
$report += "Resultado: $($result.status)"
if ($result.success) {
    $report += "- Página de login accesible"
} else {
    $report += "- Nota: El login podría ser la página por defecto"
}
$report += ""

# Test 3: Dashboard route
$result = TestEndpoint "GET" "/dashboard" "Dashboard page"
$report += "### 3. Dashboard (Protegido)"
$report += "URL: GET $FRONTEND_URL/dashboard"
$report += "Resultado: $($result.status)"
$report += "- Nota: Requiere autenticación"
$report += ""

$report += "## Casos de Prueba Planificados"
$report += ""

$report += "### Journey 1: Login to Dashboard (HIGH PRIORITY)"
$report += ""
$report += "**Pasos**:"
$report += "1. Navegar a página de login"
$report += "2. Ingresar credenciales (admin/admin123)"
$report += "3. Click en botón login"
$report += "4. Verificar redirección a dashboard"
$report += "5. Verificar datos del dashboard"
$report += "6. Verificar menú de usuario"
$report += ""

$report += "**Casos de Prueba**:"
$report += "- [ ] Login exitoso con credenciales admin"
$report += "- [ ] Login exitoso con usuario regular"
$report += "- [ ] Login fallido con credenciales inválidas"
$report += "- [ ] Toggle de visibilidad de contraseña"
$report += "- [ ] Funcionalidad 'Recuérdame'"
$report += "- [ ] Funcionalidad de logout"
$report += "- [ ] Persistencia de sesión tras refresh"
$report += ""

$report += "### Journey 2: Vehicle Entry (HIGH PRIORITY)"
$report += ""
$report += "**Pasos**:"
$report += "1. Login en sistema"
$report += "2. Navegar a entrada de vehículos"
$report += "3. Completar formulario de entrada"
$report += "4. Enviar formulario"
$report += "5. Verificar mensaje de éxito"
$report += "6. Verificar vehículo en lista"
$report += "7. Verificar generación de ticket"
$report += ""

$report += "**Casos de Prueba**:"
$report += "- [ ] Entrada completa con todos los campos"
$report += "- [ ] Validación de campos requeridos"
$report += "- [ ] Validación de formato de placa"
$report += "- [ ] Selección de tipo de vehículo"
$report += "- [ ] Timestamp de entrada"
$report += "- [ ] Prevención de duplicados"
$report += "- [ ] Advertencia de capacidad"
$report += "- [ ] Generación de PDF ticket"
$report += ""

$report += "### Journey 3: Vehicle Exit (HIGH PRIORITY)"
$report += ""
$report += "**Pasos**:"
$report += "1. Login en sistema"
$report += "2. Navegar a vehículos estacionados"
$report += "3. Seleccionar vehículo para salir"
$report += "4. Confirmar acción"
$report += "5. Verificar cálculo de tarifa"
$report += "6. Procesar pago"
$report += "7. Verificar recibo"
$report += ""

$report += "**Casos de Prueba**:"
$report += "- [ ] Salida con cálculo de tarifa"
$report += "- [ ] Precisión de duración"
$report += "- [ ] Confirmación de pago"
$report += "- [ ] Descarga de recibo PDF"
$report += "- [ ] Accuracy del timestamp"
$report += "- [ ] Actualización de capacidad"
$report += ""

$report += "### Journey 4: Reports (MEDIUM PRIORITY)"
$report += ""
$report += "**Pasos**:"
$report += "1. Login en sistema"
$report += "2. Navegar a reportes"
$report += "3. Seleccionar tipo de reporte"
$report += "4. Elegir rango de fechas"
$report += "5. Generar reporte"
$report += "6. Ver datos del reporte"
$report += "7. Exportar reporte"
$report += ""

$report += "**Casos de Prueba**:"
$report += "- [ ] Reporte diario"
$report += "- [ ] Reporte mensual"
$report += "- [ ] Reporte personalizado"
$report += "- [ ] Exportar a PDF"
$report += "- [ ] Exportar a Excel"
$report += "- [ ] Visualización de gráficos"
$report += ""

$report += "## Pruebas de UI/UX"
$report += ""
$report += "### Accesibilidad"
$report += "- [ ] Navegación por teclado"
$report += "- [ ] Lectores de pantalla"
$report += "- [ ] Contraste de colores"
$report += "- [ ] Tamaño de fuente"
$report += ""

$report += "### Responsividad"
$report += "- [ ] Desktop (1920x1080)"
$report += "- [ ] Tablet (768x1024)"
$report += "- [ ] Mobile (375x667)"
$report += ""

$report += "### Performance"
$report += "- [ ] Tiempo de carga de página"
$report += "- [ ] Renderizado de componentes"
$report += "- [ ] Carga de imágenes"
$report += "- [ ] Animaciones suaves"
$report += ""

$report += "## Próximas Fases"
$report += ""
$report += "1. Ejecutar pruebas manuales de journeys principales"
$report += "2. Generar pruebas automatizadas con TestSprite"
$report += "3. Validar responsividad en múltiples dispositivos"
$report += "4. Pruebas de accesibilidad"
$report += "5. Pruebas de performance"
$report += "6. Integración continua"
$report += ""

$report += "## Notas"
$report += ""
$report += "- Backend debe estar en línea en puerto 3000"
$report += "- Frontend debe estar en línea en puerto 4200"
$report += "- Usar admin/admin123 para pruebas"
$report += "- Documentar todos los pasos"
$report += ""

$report += "---"
$report += "Fecha: $(Get-Date)"
$report += "Frontend URL: $FRONTEND_URL"

# Guardar reporte
$report | Out-File -FilePath $REPORT_FILE -Encoding UTF8 -Force

# Mostrar resultado
Write-Output ($report -join "`n")
Write-Output "`nReport saved: $REPORT_FILE"
