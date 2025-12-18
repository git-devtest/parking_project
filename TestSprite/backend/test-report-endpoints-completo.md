# Reporte Completo de Pruebas de Endpoints
Fecha: 17/12/2025 17:54:45

## Resultados de Pruebas

### 1. Health Check
Endpoint: GET /health
Resultado: [OK]
- Version: 1.0.0
- Database: connected

### 2. Authentication (Login)
Endpoint: POST /api/auth/login
Resultado: [OK]
- Username: admin
- Role: ADMIN
- Token obtained: [OK]

### 3. Vehicle Capacity
Endpoint: GET /api/vehicles/capacity
Resultado: [OK]
- Total:   
- Occupied:   
- Available:   

### 4. Parked Vehicles
Endpoint: GET /api/vehicles/parked
Resultado: [OK]
- Total: 0

### 5. Vehicle History
Endpoint: GET /api/vehicles/history
Resultado: [OK]

### 6. User Management
Endpoint: GET /api/users
Resultado: [OK]
- Total: 8

### 7. Audit - Dashboard
Endpoint: GET /api/audit/dashboard
Resultado: [OK]

### 8. Audit - Daily
Endpoint: GET /api/audit/daily
Resultado: [OK]

### 9. Reports - Daily
Endpoint: GET /api/reports/daily
Resultado: [OK]

### 10. Insights - Statistics
Endpoint: GET /api/insights/statistics
Resultado: [FAIL]

---
Date: 12/17/2025 17:54:46
Base URL: http://localhost:3000
