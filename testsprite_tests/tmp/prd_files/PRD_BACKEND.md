# Parking Backend - Product Requirements Document (PRD)

## 1. Visión y Objetivos

### Visión del Producto
Desarrollar un sistema backend robusto y escalable para la gestión integral de estacionamientos, que permita:
- Registrar entrada/salida de vehículos
- Calcular tarifas automáticamente
- Generar reportes de ingresos
- Administrar usuarios con control de acceso
- Mantener auditoría completa de operaciones

### Objetivos Principales
- Proporcionar una API REST segura y bien documentada
- Implementar autenticación y autorización con JWT
- Asegurar integridad de datos con auditoría completa
- Facilitar backup y recuperación de datos
- Ofrecer estadísticas e insights en tiempo real

## 2. Alcance del Producto

### Funcionalidades Incluidas
1. **Autenticación y Autorización**
   - Login/Logout con JWT
   - Roles de usuario (Admin, Operador)
   - Control de acceso basado en roles (RBAC)

2. **Gestión de Vehículos**
   - Registro de entrada de vehículos
   - Registro de salida de vehículos
   - CRUD completo de vehículos
   - Seguimiento de historial

3. **Gestión de Tickets**
   - Creación automática de tickets
   - Cálculo de tarifa
   - Estados de ticket (activo, pagado, cancelado)

4. **Reportes**
   - Reportes de ingresos
   - Estadísticas de ocupación
   - Historial de transacciones

5. **Gestión de Usuarios**
   - CRUD de usuarios
   - Asignación de roles
   - Control de permisos

6. **Auditoría**
   - Registro de cambios
   - Trazabilidad de operaciones
   - Historial de acciones por usuario

7. **Backup y Restauración**
   - Backup automático en SQL
   - Backup en formato JSON
   - Restauración de backups

8. **Insights y Estadísticas**
   - Análisis de datos en tiempo real
   - Métricas del sistema

## 3. Arquitectura Técnica

### Stack Tecnológico
- **Runtime:** Node.js
- **Framework Web:** Express.js 5.1.0
- **Base de Datos:** MySQL 8.0+
- **Cliente DB:** mysql2
- **Autenticación:** JWT (jsonwebtoken)
- **Encriptación:** bcryptjs
- **Validación:** Express Validator, Joi
- **Seguridad:** Helmet, CORS, Rate Limiting
- **Logging:** Winston 3.18.3
- **Documentación:** Swagger/OpenAPI 3.0
- **Testing:** Jest, TestSprite
- **Desarrollo:** Nodemon, JSDoc

### Estructura de Directorios
```
src/
├── app.js                 # Configuración principal
├── config/
│   └── database.js       # Configuración de BD
├── controllers/          # Lógica de negocio por endpoint
├── routes/              # Definición de rutas
├── services/            # Lógica de negocio reutilizable
├── middleware/          # Middleware de Express
├── models/              # Modelos de datos
├── scripts/             # Scripts auxiliares
├── utils/               # Utilidades
└── backups/             # Almacenamiento de backups
```

### Flujo de Petición
Cliente → Middleware (Auth, Validation) → Controller → Service → Database

## 4. Especificación de API

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión

#### Vehículos
- `GET /api/vehicles` - Listar vehículos
- `POST /api/vehicles` - Crear vehículo
- `PUT /api/vehicles/:id` - Actualizar vehículo
- `DELETE /api/vehicles/:id` - Eliminar vehículo

#### Tickets
- `GET /api/tickets` - Listar tickets
- `POST /api/tickets` - Crear ticket
- `PUT /api/tickets/:id` - Actualizar ticket
- `DELETE /api/tickets/:id` - Eliminar ticket

#### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

#### Reportes
- `GET /api/reports` - Obtener reportes
- `POST /api/reports/generate` - Generar reporte

#### Auditoría
- `GET /api/audit` - Obtener logs de auditoría
- `POST /api/audit` - Registrar acción en auditoría

#### Backup
- `GET /api/backups` - Listar backups
- `POST /api/backups/create` - Crear backup
- `POST /api/backups/restore` - Restaurar backup

#### Insights
- `GET /api/insights` - Obtener estadísticas

## 5. Seguridad

### Medidas de Seguridad Implementadas
- **Autenticación JWT:** Tokens seguros para validar usuario
- **Encriptación de Contraseñas:** Uso de bcryptjs con salt
- **CORS:** Configurado para orígenes permitidos específicos
- **Helmet:** Headers HTTP de seguridad
- **Rate Limiting:** Prevención de ataques por fuerza bruta
- **Validación de Entrada:** Sanitización y validación de datos
- **RBAC:** Control de acceso basado en roles

### Medidas de Protección de Datos
- Auditoría completa de cambios
- Encriptación en tránsito (HTTPS en producción)
- Backups regulares
- Logs de acceso y errores

## 6. No-Funcionales

### Rendimiento
- API debe responder en < 500ms para 95% de peticiones
- Soporte para múltiples usuarios concurrentes
- Compresión de respuestas HTTP

### Disponibilidad
- Uptime objetivo: 99.5%
- Recuperación ante fallos

### Escalabilidad
- Arquitectura modular y desacoplada
- Preparada para crecimiento de datos

### Mantenibilidad
- Código bien documentado con JSDoc
- Logs detallados con Winston
- Estructura clara de carpetas

## 7. Datos y Modelos

### Entidades Principales
- **Usuario:** id, username, email, role, contraseña (encriptada)
- **Vehículo:** id, placa, tipo, propietario, estado
- **Ticket:** id, vehículo_id, fecha_entrada, fecha_salida, tarifa, estado
- **Auditoría:** id, usuario_id, acción, tabla_afectada, timestamp
- **Reporte:** id, tipo, datos, fecha_generación

## 8. Plan de Testing

### Pruebas Incluidas
- Pruebas unitarias con Jest
- Pruebas de API con TestSprite
- Pruebas de integración
- Validación de endpoints

### Ejecución de Tests
```bash
npm test                        # Pruebas unitarias
npm run test:testsprite:api    # Pruebas de API
npm run test:testsprite:integration # Pruebas de integración
```

## 9. Documentación

### Documentación Disponible
- **Swagger/OpenAPI:** `/api-docs` en la aplicación
- **README:** Instrucciones de instalación y uso
- **JSDoc:** Documentación en el código fuente
- **Test Plan:** Escenarios de testing

## 10. Dependencias Clave

### Producción
- express@5.1.0
- mysql2@3.15.3
- jsonwebtoken@9.0.2
- bcryptjs@3.0.3
- helmet@8.1.0
- cors@2.8.5
- express-validator@7.3.0
- winston@3.18.3
- swagger-ui-express@5.0.1

### Desarrollo
- jest@30.2.0
- nodemon@3.1.11
- jsdoc@4.0.5

## 11. Criterios de Aceptación

- [ ] API completamente funcional y documentada
- [ ] Todos los endpoints testados
- [ ] Autenticación y autorización implementadas
- [ ] Backup y restauración operacional
- [ ] Auditoría registrando correctamente
- [ ] Reportes generándose correctamente
- [ ] Performance dentro de especificaciones
- [ ] Cobertura de tests >= 80%

## 12. Métricas de Éxito

- Tiempo de respuesta < 500ms en 95% de peticiones
- Disponibilidad >= 99.5%
- Cobertura de tests >= 80%
- Cero vulnerabilidades críticas de seguridad
- Documentación 100% completa
