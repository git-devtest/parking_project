## Parking Backend

API REST para la gestión de un sistema de estacionamiento (backend). Provee endpoints para registrar entradas/salidas de vehículos, consultar vehículos estacionados, obtener capacidad, historial y reportes.

## Tecnologías

- Node.js
- Express
- MySQL (mysql2)
- dotenv (gestión de variables de entorno)
- Joi (validación)
- Helmet, compression, cors (seguridad y performance)
- express-rate-limit (limitación de peticiones)
- Winston + morgan (logging)
- Jest (tests)
- Nodemon (dev)
- bcryptjs (para hashear y comparar contraseñas de forma segura)
- jsonwebtoken (para emitir y verificar JWTs cuando se implementa autenticación basada en tokens)
- express-validator (para validación y saneamiento a nivel de rutas (complementa a Joi cuando se usa middleware por ruta)).

Las dependencias principales se encuentran en `package.json`.

## Requisitos

- Node.js 16+ (o versión LTS moderna)
- MySQL accesible (local o remoto)
- Variables de entorno configuradas (ver sección abajo)

## Instalación

1. Clonar el repositorio o copiar el contenido del backend.
2. Moverse al directorio del backend:

```powershell
cd e:\parking-project\parking-backend
```

3. Instalar dependencias:

```powershell
npm install
```

4. Crear un archivo `.env` basado en el ejemplo (ver Variables de entorno) y ajustar datos de la base de datos.

## Variables de entorno

El proyecto usa `dotenv`. Variables relevantes (nombres usados en el código):

- `PORT` — Puerto donde correr el servidor (default 3000)
- `NODE_ENV` — Entorno (development, production)
- `DB_HOST` — Host de la base de datos MySQL
- `DB_USER` — Usuario de la base de datos
- `DB_PASSWORD` — Contraseña de la base de datos
- `DB_NAME` — Nombre de la base de datos
- `DB_PORT` — Puerto de la base de datos (ej. 3306)
- `RATE_LIMIT_WINDOW_MS` — Ventana para rate limit (ms)
- `RATE_LIMIT_MAX_REQUESTS` — Máx peticiones por ventana

Ejemplo mínimo de `.env`:

```text
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=secret
DB_NAME=parking_db
DB_PORT=3306
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Scripts disponibles

Los scripts definidos en `package.json`:

- `npm start` — Ejecuta `node server.js` (producción)
- `npm run dev` — Ejecuta `nodemon server.js` (desarrollo)
- `npm test` — Ejecuta tests con Jest

Ejecutar en desarrollo:

```powershell
npm run dev
```

## Endpoints principales

Base: `/api`

- Health check
	- GET `/health` — Comprueba que el servicio está levantado.

- Vehículos (`/api/vehicles`)
	- POST `/entry` — Registrar entrada de vehículo (valida cuerpo con Joi)
	- POST `/exit` — Registrar salida de vehículo (valida cuerpo con Joi)
	- GET `/parked` — Obtener lista de vehículos actualmente estacionados
	- GET `/capacity` — Obtener capacidad/ocupación actual del estacionamiento
	- GET `/history` — Obtener historial de vehículos

- Reportes (`/api/reports`)
	- GET `/daily` — Reporte diario (acepta filtros de fecha)
	- GET `/dashboard` — Datos agregados para dashboard
	- GET `/custom` — Reporte personalizado por rango de fechas

Para más detalles revisar los controladores en `src/controllers/` y validaciones en `src/middleware/validation.js`.

## Base de datos

La conexión a MySQL se maneja desde `src/config/database.js` usando `mysql2/promise` y un pool de conexiones. Antes de iniciar el servidor, `server.js` ejecuta `testConnection()` para verificar la conectividad.

Si `NODE_ENV` está en `development`, el servidor también ejecuta una verificación de estructura (`src/utils/dbCheck.js`).

## Logging y manejo de errores

- Logging: `winston` para logs estructurados y `morgan` para logs HTTP (en `src/utils/logger.js`).
- Manejo de errores: `src/middleware/errorHandler.js` centraliza respuestas de error y rutas no encontradas.
- El servidor implementa shutdown gracioso (graceful shutdown) y maneja `unhandledRejection` y `uncaughtException`.

## Tests

Se utiliza Jest para pruebas unitarias. Ejecutar:

```powershell
npm test
```

## Estructura del proyecto (resumen)

```
parking-backend/
	src/
		config/       # Configuración de BD
		controllers/  # Lógica de endpoints
		routes/       # Definición de rutas
		services/     # Lógica de negocio / acceso a datos
		middleware/   # Validaciones y manejo de errores
		utils/        # Utilidades (logger, dbCheck...)
	server.js
	package.json
```

## Contribuir

1. Abrir un issue describiendo la mejora o bug.
2. Crear una rama feature/ o fix/ con cambios claros.
3. Añadir tests cuando sea posible.

## Notas finales

- Asegúrate de que la base de datos exista y que las credenciales en `.env` sean correctas antes de iniciar.
- En producción revisa la configuración de `helmet`, `rate-limit` y el uso de SSL para la BD si aplica.

---

README generado automáticamente — ver archivos de código para detalles adicionales.

