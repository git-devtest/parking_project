@echo off
REM Script para probar los endpoints principales del backend

echo.
echo ===================================
echo Iniciando pruebas del Backend
echo ===================================
echo.

REM Variables
set BASE_URL=http://localhost:3000
set ADMIN_USER=admin
set ADMIN_PASS=admin123

echo [1] Verificando salud del servidor...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/health' -Method GET | ConvertTo-Json"

echo.
echo [2] Intentando login como admin...
powershell -Command "$body = @{username='%ADMIN_USER%'; password='%ADMIN_PASS%'} | ConvertTo-Json; Invoke-RestMethod -Uri '%BASE_URL%/api/auth/login' -Method POST -Body $body -ContentType 'application/json'"

echo.
echo [3] Listando usuarios...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/api/users' -Method GET | ConvertTo-Json"

echo.
echo [4] Obteniendo capacidad de estacionamiento...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/api/vehicles/capacity' -Method GET | ConvertTo-Json"

echo.
echo [5] Obteniendo vehículos estacionados...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/api/vehicles/parked' -Method GET | ConvertTo-Json"

echo.
echo ===================================
echo Pruebas completadas
echo ===================================
