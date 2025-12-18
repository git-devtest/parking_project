# Ejecutar Pruebas con TestSprite - Guía Rápida

## ✅ Estado Actual

- ✅ Backend corriendo en `http://localhost:3000`
- ✅ Frontend corriendo en `http://localhost:4200`
- ✅ API Key de TestSprite configurada en `.testspriterc`
- ✅ Planes de prueba creados (106 casos backend + 138+ casos frontend)

---

## 🚀 Cómo Ejecutar las Pruebas

### Opción 1: Usando TestSprite CLI (Si está instalado)

#### Backend API Tests
```powershell
cd parking-backend
npm run test:testsprite:api
```

#### Frontend E2E Tests
```powershell
cd parking-frontend
npm run test:testsprite:e2e
```

#### Todas las Pruebas
```powershell
# Backend
cd parking-backend
npm run test:all

# Frontend
cd parking-frontend
npm run test:all
```

---

### Opción 2: Usando TestSprite a través de tu IDE

Si instalaste TestSprite MCP en tu IDE (VS Code, Cursor, etc.):

1. **Abre el asistente AI de tu IDE**
2. **Escribe uno de estos comandos**:
   - "Test this project with TestSprite"
   - "Run API tests with TestSprite"
   - "Run E2E tests with TestSprite"
3. **El asistente AI ejecutará las pruebas automáticamente**

---

### Opción 3: Usando TestSprite Dashboard

1. Ve a [testsprite.com/dashboard](https://testsprite.com/dashboard)
2. Selecciona tu proyecto "parking-project"
3. Haz clic en "Run Tests"
4. Selecciona el tipo de pruebas:
   - API Tests (Backend)
   - E2E Tests (Frontend)
   - Full Stack Tests
5. Haz clic en "Start Test Run"

---

## 📊 Ver Resultados

### Reportes Locales
Después de ejecutar las pruebas, los reportes se generarán en:
```
test-reports/
├── index.html          # Reporte visual principal
├── results.json        # Resultados en JSON
├── junit.xml          # Formato JUnit para CI/CD
└── screenshots/       # Capturas de pantalla de fallos
```

Abre el reporte:
```powershell
start test-reports/index.html
```

### Dashboard en la Nube
Visita: [testsprite.com/dashboard](https://testsprite.com/dashboard)

Verás:
- ✅ Estado de las pruebas (Pass/Fail)
- 📊 Cobertura de código
- 🐛 Bugs detectados con análisis de causa raíz
- 📸 Screenshots y videos de las pruebas
- ⏱️ Métricas de rendimiento

---

## 🎯 Pruebas Disponibles

### Backend (106 casos de prueba)

| Grupo | Endpoint | Casos |
|-------|----------|-------|
| Health | `/health` | 6 |
| Auth | `/api/auth/*` | 12 |
| Vehicles | `/api/vehicles/*` | 28 |
| Reports | `/api/reports/*` | 18 |
| Users | `/api/users/*` | 15 |
| Tickets | `/api/tickets/*` | 8 |
| Insights | `/api/insights/*` | 7 |
| Audit | `/api/audit/*` | 7 |
| Backups | `/api/backups/*` | 5 |

### Frontend (138+ casos de prueba)

| Tipo | Descripción | Casos |
|------|-------------|-------|
| User Journeys | Login, Entry, Exit, Reports, Admin | 38 |
| Components | Dashboard, Forms, Tables, Charts | 50 |
| Accessibility | WCAG AA, Keyboard, Screen readers | 30 |
| Performance | Load times, Runtime | 20+ |

---

## 🔍 Ejemplo de Ejecución

### 1. Prueba Simple del Health Endpoint

```powershell
cd parking-backend

# Ejecutar solo pruebas del health endpoint
testsprite run --suite=api --filter="health" --config ../testsprite.config.json
```

### 2. Prueba del Login Flow

```powershell
cd parking-frontend

# Ejecutar solo pruebas del flujo de login
testsprite run --suite=e2e --filter="login" --config ../testsprite.config.json
```

### 3. Prueba Completa con Reporte

```powershell
# Backend
cd parking-backend
npm run test:testsprite:api -- --coverage --report

# Frontend
cd parking-frontend
npm run test:testsprite:e2e -- --coverage --report
```

---

## ⚠️ Notas Importantes

### Si TestSprite CLI no está disponible

TestSprite puede funcionar de dos maneras:

1. **CLI Standalone**: Requiere instalación del paquete TestSprite
2. **MCP Integration**: Funciona a través del asistente AI de tu IDE

Si los comandos `testsprite` no funcionan, significa que estás usando la integración MCP. En ese caso:

- Usa tu asistente AI del IDE para ejecutar las pruebas
- O usa el dashboard web de TestSprite
- Los scripts en `package.json` pueden necesitar ajuste

### Credenciales de Prueba

Para las pruebas de autenticación, usa:
- **Admin**: `admin` / `Admin123!`
- **Usuario**: `user` / `User123!`

(Verifica que estos usuarios existan en tu base de datos)

### Base de Datos

Las pruebas usarán tu base de datos configurada en `parking-backend/.env`. Considera:
- Crear una base de datos de pruebas separada
- O usar transacciones para rollback después de cada prueba
- Hacer backup antes de ejecutar pruebas extensivas

---

## 🆘 Solución de Problemas

### Error: "TestSprite API key invalid"
- Verifica que la API key en `.testspriterc` sea correcta
- Revisa que no haya espacios extra
- Regenera la key en el dashboard si es necesario

### Error: "Cannot connect to backend"
- Verifica que el backend esté corriendo: `http://localhost:3000/health`
- Revisa los logs del backend
- Verifica la configuración de CORS

### Error: "Cannot connect to frontend"
- Verifica que el frontend esté corriendo: `http://localhost:4200`
- Revisa los logs del frontend
- Intenta reconstruir: `npm run build`

### Pruebas muy lentas
- Reduce el número de workers en `testsprite.config.json`
- Ejecuta pruebas específicas en lugar de todas
- Usa filtros para ejecutar solo lo necesario

---

## 📚 Más Información

- **Guía Completa**: Ver [TESTING.md](../TESTING.md)
- **Planes de Prueba**: 
  - Backend: [parking-backend/tests/api/test-plan.md](../parking-backend/tests/api/test-plan.md)
  - Frontend: [parking-frontend/tests/e2e/test-plan.md](../parking-frontend/tests/e2e/test-plan.md)
- **TestSprite Docs**: [docs.testsprite.com](https://docs.testsprite.com)

---

**¡Listo para probar!** 🎉

Ejecuta tu primera prueba y revisa los resultados en el dashboard.
