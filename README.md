# Parking Project 🚗🅿️

## Descripción general  
Parking Project es una aplicación web full-stack para la **gestión y cobro de tarifas de parqueadero**.  
El backend está desarrollado en **Node.js**; el frontend en **Angular 20**.  
El proyecto incluye los artefactos del modelo de base de datos (diagrama entidad-relación), lo que permite levantar una base de datos relacional para soportar la lógica de negocios.

Este README actúa como guía principal para entender la arquitectura global, levantar la aplicación en local, y usar/contribuir al proyecto.

## Estructura del repositorio  
```bash
/   
├── parking-backend/      # Código del backend (API REST, lógica de negocios, DB)   
├── parking-frontend/     # Código del frontend (Angular)   
├── Modelo BD.mwb         # Modelo de base de datos (MySQL Workbench)   
├── Modelo ER.png         # Diagrama ER de la base de datos   
└── README.md             # Este archivo (documentación general del proyecto)
```

## Tecnologías principales  

- **Backend**: Node.js, Express, (posiblemente MySQL / MySQL2 / otro cliente SQL)  
- **Frontend**: Angular 20, TypeScript, HTML, CSS, (Bootstrap u otro framework de estilos si lo usas)  
- **Base de datos**: Modelo relacional definido (puedes usar MySQL o variante compatible)  

## Cómo correr el proyecto (modo desarrollo)  
Asegúrate de tener instalados Node.js, npm (o yarn), y un servidor de base de datos compatible (MySQL u otro).

### 1. Backend  

```bash
cd parking-backend/
npm install          # Instala dependencias
# Configura variables de entorno necesarias (conexión a BD, credenciales, puerto, secret JWT, etc.)
npm start            # (o el script que uses para arrancar el servidor)
```   
Crear la base de datos usando el diagrama Modelo BD.mwb, o ejecutar los scripts/migraciones si los tienes.   
El backend debería quedar disponible en la URL que hayas configurado (por ejemplo http://localhost:3000).

### 2. Frontend   
```bash
cd parking-frontend/
npm install          # Instala dependencias del frontend
# Si usas Angular CLI: ng serve  (o el script equivalente)
```
Asegúrate de que la configuración del frontend (URL de la API, puertos) coincide con la del backend.   
Abre tu navegador en http://localhost:4200 (o el puerto configurado) para usar la app.

## Funcionalidades / Qué puedes hacer   
1. Registrar vehículos que ingresan y salen del parqueadero.
2. Calcular tarifas según tiempo de estancia y plazas / tarifas configuradas.
3. Registrar plazas, configuración de tarifas, administrar parqueadero.
4. Autenticación / roles de usuario — backend incluye control de acceso.
5. Registrar historial de ingresos / egresos, generar reportes.   

Si ya tienes un diseño de base de datos, puedes explorar la estructura de tablas para entender entidades como Vehículo, Parqueadero, Reserva/Estancia, Tarifa, Usuario, etc.

## Desarrollo / Contribuciones   
Si deseas contribuir o mejorar el proyecto:   
1. Haz un fork del repo.   
2. Crea una rama nueva: git checkout -b feature/mi-feature   
3. Haz tus cambios y asegúrate de que funciona todo.   
4. Envía un pull request con tus cambios y una descripción clara de lo que agregaste/modificaste.   

Si lo deseas puedes agregar:   
1. Scripts útiles (por ejemplo: para levantar DB, seed de datos, lint, test, build)
2. Documentación adicional: endpoints de la API, ejemplos de uso, screenshots del frontend, etc.
3. Badges (por versión de Node, Angular, estado de build, etc).   

## Estado del proyecto   
Proyecto en desarrollo / versión inicial.   
Puede estar incompleto o carecer de ciertas funcionalidades. Úsalo como base o referencia, o para aprender.

## Licencia   
