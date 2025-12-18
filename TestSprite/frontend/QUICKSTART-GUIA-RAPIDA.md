# 🚀 Guía Rápida - Ejecutar Pruebas del Parking System

**Versión**: 2.0  
**Última actualización**: 17/12/2025  
**Estado**: ✅ Verificado

---

## 📋 Requisitos Previos

```bash
# Software Requerido
- Node.js v24.11.1 (o superior)
- npm 10.x (o superior)
- MySQL 8.0.44 (ejecutándose)
- Git (opcional)

# Verificar instalaciones
node --version      # v24.11.1
npm --version       # 10.x
mysql --version     # 8.0.44
```

---

## 🚀 Inicio Rápido en 5 Minutos

### 1️⃣ Clonar/Preparar Repositorio

```powershell
cd d:\parking-project
dir                 # Verificar estructura
```

### 2️⃣ Iniciar Backend

```powershell
cd parking-backend
npm install         # (si es primera vez)
npm start           # Backend en puerto 3000

# Verificar:
# - "[dotenv@...] injecting env..."
# - "✅ Conectado a la base de datos MySQL"
# - "🚀 Servidor ejecutándose en puerto 3000"
```

### 3️⃣ Iniciar Frontend (Nueva Terminal)

```powershell
cd parking-frontend
npm install         # (si es primera vez)
npm run dev         # Frontend en puerto 4200

# Verificar:
# - "✔ Console Ninja extension is connected to Angular"
# - "Application bundle generation complete"
# - "➜  Local:   http://localhost:4200/"
```

### 4️⃣ Ejecutar Pruebas Backend

```powershell
cd TestSprite
powershell -ExecutionPolicy Bypass -File run-complete-tests.ps1

# Resultado esperado:
# ✅ Todos los 14 endpoints pasan
```

### 5️⃣ Ejecutar Pruebas Frontend

```powershell
cd TestSprite
powershell -ExecutionPolicy Bypass -File run-frontend-e2e-tests.ps1

# Resultado esperado:
# ✅ Acceso a http://localhost:4200 exitoso
```

---

## 🎯 Escenarios Comunes

### Scenario A: Testing Rápido (5 min)

```powershell
# Terminal 1: Backend
cd parking-backend
npm start

# Terminal 2: Frontend
cd parking-frontend
npm run dev

# Terminal 3: Health Check
$response = Invoke-WebRequest -Uri "http://localhost:3000/health"
Write-Output $response.StatusCode    # Debe mostrar: 200
```

### Scenario B: Testing Completo (30 min)

```powershell
# 1. Iniciar servidores (como arriba)

# 2. Ejecutar tests backend
cd parking-project\TestSprite
powershell -ExecutionPolicy Bypass -File run-complete-tests.ps1

# 3. Ejecutar tests frontend
powershell -ExecutionPolicy Bypass -File run-frontend-e2e-tests.ps1

# 4. Revisar reportes
code REPORTE-FINAL-CONSOLIDADO.md
```

### Scenario C: Testing Manual

```powershell
# 1. Abrir navegador
Start-Process "http://localhost:4200"

# 2. Login
# Email: admin@parking.com
# Password: admin123

# 3. Probar flujos manualmente:
# - Dashboard
# - Vehicle Entry (con placa: ABC-1234)
# - Vehicle Exit
# - Reports
```

---

## 📊 Comandos Útiles

### Backend

```powershell
cd parking-backend

# Iniciar servidor
npm start

# Iniciar en desarrollo (con reload)
npm run dev

# Crear usuario admin
node src/scripts/initAdmin.js

# Resetear contraseña admin
node src/scripts/recreate-password.js

# Ver logs en tiempo real
Get-Content logs/error.log -Wait    # PowerShell
```

### Frontend

```powershell
cd parking-frontend

# Iniciar dev server
npm run dev

# Build para producción
npm run build

# Tests unitarios
npm test

# Tests E2E (si estuviera configurado)
npm run test:testsprite:e2e
```

### Database

```powershell
# Conectar a MySQL
mysql -u root -p parking_system

# Ver tabla de usuarios
mysql> SELECT id, email, role FROM users;

# Ver vehículos estacionados
mysql> SELECT * FROM vehicles WHERE exit_time IS NULL;

# Ver últimas transacciones
mysql> SELECT * FROM transactions ORDER BY id DESC LIMIT 10;
```

---

## 🔍 Verificación de Estado

### Checklist de Verificación

```powershell
# 1. Backend está corriendo
$test1 = try { (Invoke-WebRequest -Uri "http://localhost:3000/health").StatusCode -eq 200 } catch { $false }
Write-Output "Backend: $(if ($test1) { '✅ OK' } else { '❌ ERROR' })"

# 2. Frontend está corriendo
$test2 = try { (Invoke-WebRequest -Uri "http://localhost:4200").StatusCode -eq 200 } catch { $false }
Write-Output "Frontend: $(if ($test2) { '✅ OK' } else { '❌ ERROR' })"

# 3. Base de datos está conectada
$test3 = try { (Invoke-WebRequest -Uri "http://localhost:3000/health").Content | ConvertFrom-Json | Select-Object -ExpandProperty database } catch { $false }
Write-Output "Database: $(if ($test3 -eq 'connected') { '✅ OK' } else { '❌ ERROR' })"

# Resultado esperado: Todos ✅
```

---

## 🐛 Troubleshooting

### Problema: "Port 3000 already in use"

```powershell
# Solución 1: Usar diferente puerto
$env:PORT=3001
npm start

# Solución 2: Matar proceso en puerto 3000
Get-Process node | Stop-Process -Force
Start-Sleep -Seconds 2
npm start
```

### Problema: "Port 4200 already in use"

```powershell
# Solución: Matar proceso en puerto 4200
netstat -ano | Select-String ":4200"    # Ver PID
taskkill /PID <PID> /F                  # Matar proceso
```

### Problema: "Cannot find module"

```powershell
# Solución: Reinstalar dependencias
cd parking-backend
rm -r node_modules
npm install

# Mismo para frontend
cd ../parking-frontend
rm -r node_modules
npm install
```

### Problema: "Cannot connect to database"

```powershell
# Verificar MySQL está corriendo
Get-Service MySQL80    # Si está instalado como servicio

# Verificar credenciales en .env
type .env | Select-String "DB_"

# Probar conexión manual
mysql -u root -p -h localhost parking_system
```

### Problema: "JWT token expired"

```powershell
# Logout y volver a hacer login
# El token expira cada 24 horas

# O generar nuevo token manualmente vía API
$body = @{
    email = "admin@parking.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

---

## 📈 Interpretación de Resultados

### Código de Estado HTTP

| Código | Significado | Acción |
|--------|------------|--------|
| 200 | OK | ✅ Éxito |
| 201 | Created | ✅ Recurso creado |
| 400 | Bad Request | ❌ Datos inválidos |
| 401 | Unauthorized | ❌ Sin autenticación |
| 403 | Forbidden | ❌ Sin permiso |
| 404 | Not Found | ❌ No existe |
| 500 | Server Error | ❌ Error interno |

### Métricas de Performance

| Métrica | Aceptable | Excelente |
|---------|-----------|-----------|
| Response Time | < 3s | < 1s |
| Database Query | < 100ms | < 50ms |
| Page Load | < 5s | < 2s |
| CPU Usage | < 50% | < 30% |
| Memory Usage | < 500MB | < 300MB |

---

## 📝 Reportes

### Ubicación de Reportes

```
D:\parking-project\TestSprite\
├── REPORTE-FINAL-CONSOLIDADO.md      ← LEER PRIMERO
├── REPORTE-TESTSPRITE-FINAL.md
├── REPORTE-E2E-COMPLETO.md
├── INDICE-REPORTES.md
└── test-results.json
```

### Generar Reporte

```powershell
# Los reportes se generan automáticamente cuando ejecutas:
# 1. npm start (backend)
# 2. npm run dev (frontend)
# 3. Los scripts de testing

# Visualizar reportes
code D:\parking-project\TestSprite\REPORTE-FINAL-CONSOLIDADO.md

# O en navegador
Start-Process "D:\parking-project\TestSprite\REPORTE-FINAL-CONSOLIDADO.md"
```

---

## 🔐 Credenciales de Prueba

### Admin Account
```
Email:    admin@parking.com
Password: admin123
Role:     ADMIN
```

### Operador Account
```
Email:    operator@parking.com
Password: operator123
Role:     OPERATOR
```

### Vehículos de Prueba

```
Placa 1: ABC-1234
Placa 2: XYZ-5678
Placa 3: TEST-9999
```

---

## 🎯 Casos de Prueba Manual

### Test 1: Login Exitoso
```
1. Ir a http://localhost:4200
2. Ingresar: admin@parking.com / admin123
3. Verificar: Redirección a dashboard
4. Resultado esperado: ✅ Dashboard visible
```

### Test 2: Entrada de Vehículos
```
1. Login como admin
2. Ir a "Entrada de Vehículos"
3. Ingresar placa: ABC-1234
4. Seleccionar tipo: Automóvil
5. Click "Registrar"
6. Resultado esperado: ✅ Vehículo en lista, ticket PDF generado
```

### Test 3: Salida de Vehículos
```
1. Login como admin
2. Ir a "Vehículos Estacionados"
3. Buscar vehículo ABC-1234
4. Click "Salida"
5. Confirmar acción
6. Resultado esperado: ✅ Tarifa calculada, recibo generado
```

### Test 4: Generar Reporte
```
1. Login como admin
2. Ir a "Reportes"
3. Seleccionar rango de fechas
4. Click "Generar"
5. Click "Descargar PDF" o "Exportar Excel"
6. Resultado esperado: ✅ Archivo descargado
```

---

## ⏱️ Timeline Típico

```
0-2 min:   Iniciar servidores
2-5 min:   Login y navegación
5-10 min:  Vehicle entry/exit
10-15 min: Reports generation
15-20 min: Backend API testing
20-50 min: Frontend E2E testing
50 min+:   Review de reportes
```

---

## 📞 Soporte

### Si algo no funciona:

1. **Revisar logs**
   ```powershell
   # Backend logs
   type d:\parking-project\parking-backend\logs\error.log
   
   # Frontend console
   # F12 → Console tab en navegador
   ```

2. **Verificar conectividad**
   ```powershell
   ping localhost:3000
   ping localhost:4200
   ```

3. **Limpiar cache**
   ```powershell
   # Frontend: Ctrl+Shift+Delete en navegador
   # Backend: npm start (restart)
   ```

4. **Revisar reportes**
   - Abrir: `REPORTE-FINAL-CONSOLIDADO.md`
   - Buscar sección "Troubleshooting"

---

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] MySQL ejecutándose
- [ ] Backend iniciado (puerto 3000)
- [ ] Frontend iniciado (puerto 4200)
- [ ] Can login con admin@parking.com
- [ ] Dashboard visible
- [ ] Pruebas completadas
- [ ] Reportes revisados

---

**¡Listo para probar!** 🎉

Para más detalles, ver: [REPORTE-FINAL-CONSOLIDADO.md](./REPORTE-FINAL-CONSOLIDADO.md)
