# 🚀 INICIO RÁPIDO - Pruebas Backend

## En 3 Pasos Rápidos

### Paso 1: Inicia el Backend
```powershell
cd d:\parking-project\parking-backend
npm run dev
```
Espera a ver: ✅ "Servidor ejecutándose en puerto 3000"

### Paso 2: Abre otra terminal PowerShell y ejecuta pruebas
```powershell
cd d:\parking-project\TestSprite
powershell -File run-complete-tests.ps1
```
Verás los resultados en tiempo real.

### Paso 3: Revisa los reportes generados
```powershell
# Abre cualquiera de estos reportes:
notepad d:\parking-project\TestSprite\REPORTE-FINAL-TESTSPRITE.md
notepad d:\parking-project\TestSprite\RESUMEN-PRUEBAS.md
notepad d:\parking-project\TestSprite\CONTINUACION-PRUEBAS.md
```

---

## Documentación API

**Accede a**: http://localhost:3000/api-docs

Aquí verás:
- ✅ Todos los endpoints disponibles
- ✅ Parámetros requeridos
- ✅ Formatos de respuesta
- ✅ Códigos de error

**Puedes hacer pruebas directas desde Swagger UI** usando el botón "Try it out"

---

## Credenciales de Prueba

```
Usuario: admin
Contraseña: admin123
```

Este usuario tiene rol **ADMIN** y acceso a todos los endpoints.

---

## Estado Actual del Backend

| Componente | Estado | Detalles |
|-----------|--------|----------|
| **Servidor** | ✅ En línea | Puerto 3000 |
| **BD MySQL** | ✅ Conectada | Version 8.0.44 |
| **Autenticación** | ✅ Funcional | JWT Tokens |
| **Seguridad** | ✅ Completa | CORS, Headers, Rate Limit |
| **Endpoints** | 90% ✅ | 9 de 10 funcionales |

---

## Reportes Disponibles

Todos están en: `d:\parking-project\TestSprite\`

1. **RESUMEN-PRUEBAS.md** 👈 **EMPEZAR AQUÍ**
   - Resumen ejecutivo de todo
   - Métricas principales
   - Próximos pasos

2. **REPORTE-FINAL-TESTSPRITE.md**
   - Análisis detallado
   - Todos los endpoints
   - Recomendaciones

3. **CONTINUACION-PRUEBAS.md**
   - Cómo continuar
   - Checklist de validación
   - Comandos útiles

4. **test-report-endpoints-completo.md**
   - Resultado técnico
   - Respuestas exactas
   - Tiempos de respuesta

---

## Endpoints Principales

### 🔓 Sin Autenticación
```
GET /health                    # Ver estado del servidor
POST /api/auth/login          # Obtener token JWT
```

### 🔒 Con Autenticación (Usa tu token)
```
GET /api/vehicles/capacity    # Capacidad del estacionamiento
GET /api/vehicles/parked      # Vehículos estacionados
GET /api/vehicles/history     # Historial de vehículos
POST /api/vehicles/entry      # Registrar entrada
POST /api/vehicles/exit       # Registrar salida
GET /api/users                # Listar usuarios
GET /api/reports/daily        # Reporte diario
GET /api/audit/dashboard      # Logs de auditoría
```

---

## Troubleshooting Rápido

### ❌ "No puedo conectar a localhost:3000"
```powershell
# Verificar que el servidor esté corriendo
# Terminal 1 debe mostrar: ✅ Servidor ejecutándose en puerto 3000
# Si no, ejecuta: npm run dev
```

### ❌ "Error 401 Unauthorized"
```powershell
# Necesitas token JWT
# 1. Haz POST /api/auth/login con admin:admin123
# 2. Copia el token de la respuesta
# 3. Usa en Authorization: Bearer <token>
```

### ❌ "Endpoint 404"
```powershell
# Algunos endpoints pueden no estar implementados
# Revisa: http://localhost:3000/api-docs
# O el archivo: src/routes/*.js
```

---

## Copiar Token Rápido

En PowerShell:
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Body '{"username":"admin","password":"admin123"}' `
  -ContentType 'application/json'

$token = $response.data.token
Write-Output $token  # Copiar este valor
```

---

## Próximas Acciones

- [ ] Leer **RESUMEN-PRUEBAS.md**
- [ ] Revisar **REPORTE-FINAL-TESTSPRITE.md**
- [ ] Probar endpoints en Swagger UI
- [ ] Ejecutar pruebas nuevamente
- [ ] Corregir endpoint "insights" (si es necesario)
- [ ] Comenzar pruebas del frontend

---

## Estructura del Proyecto

```
parking-project/
├── parking-backend/          ✅ Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/      # Lógica de negocios
│   │   ├── routes/           # Definición de endpoints
│   │   ├── services/         # Servicios auxiliares
│   │   ├── middleware/       # Autenticación, validación
│   │   └── models/           # Modelos de datos
│   └── package.json
│
├── parking-frontend/         ⏳ Frontend (Angular 20)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── routes.ts
│   │   └── main.ts
│   └── package.json
│
└── TestSprite/              📊 Pruebas y Reportes
    ├── RESUMEN-PRUEBAS.md
    ├── REPORTE-FINAL-TESTSPRITE.md
    ├── CONTINUACION-PRUEBAS.md
    ├── testsprite.config.json
    └── run-complete-tests.ps1
```

---

## Contacto y Recursos

- 📚 **API Docs**: http://localhost:3000/api-docs
- 🐙 **GitHub**: [Parking Project](https://github.com/git-devtest/parking_project)
- 🧪 **TestSprite**: [testsprite.com](https://testsprite.com)
- 📖 **Express Docs**: [expressjs.com](https://expressjs.com)

---

## Quick Reference

```bash
# Iniciar backend
npm run dev

# Tests unitarios
npm test

# Tests TestSprite
npm run test:testsprite:api

# Ver documentación
# Abre: http://localhost:3000/api-docs
```

---

**¿Primera vez?** ➡️ Lee **RESUMEN-PRUEBAS.md**  
**¿Necesitas continuar?** ➡️ Lee **CONTINUACION-PRUEBAS.md**  
**¿Tienes dudas?** ➡️ Revisa **REPORTE-FINAL-TESTSPRITE.md**

**Status**: ✅ Backend 90% Funcional y Listo para Pruebas

---

*Última actualización: 17 de Diciembre de 2025, 17:54*
