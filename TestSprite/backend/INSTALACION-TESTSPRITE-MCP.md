# Instalación de TestSprite MCP en tu IDE

## ¿Qué IDE estás usando?

TestSprite MCP se puede instalar en varios IDEs. Selecciona el tuyo:

---

## 🔵 Visual Studio Code (VS Code)

### Paso 1: Instalar la extensión MCP

1. Abre VS Code
2. Ve a la pestaña de **Extensions** (Ctrl+Shift+X)
3. Busca "Model Context Protocol" o "MCP"
4. Instala la extensión oficial de MCP

### Paso 2: Configurar TestSprite MCP

1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Escribe "MCP: Configure Servers"
3. Se abrirá el archivo de configuración `mcp-settings.json`

Agrega la siguiente configuración:

```json
{
  "mcpServers": {
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"],
      "env": {
        "TESTSPRITE_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

### Paso 3: Reemplazar la API Key

Copia tu API key desde `.testspriterc` y pégala en la configuración:

```powershell
# Ver tu API key
Get-Content .testspriterc | Select-String "TESTSPRITE_API_KEY"
```

### Paso 4: Reiniciar VS Code

1. Cierra VS Code completamente
2. Ábrelo de nuevo
3. Verifica que TestSprite MCP esté activo en la barra de estado

### Paso 5: Probar la conexión

1. Abre el chat de AI (si tienes GitHub Copilot o similar)
2. Escribe: "Test this project with TestSprite"
3. El asistente debería reconocer TestSprite y ejecutar las pruebas

---

## 🟢 Cursor IDE

### Paso 1: Acceder a la configuración de MCP

1. Abre Cursor
2. Ve a **Settings** → **Features** → **Model Context Protocol**
3. O presiona `Cmd/Ctrl + Shift + P` y busca "MCP Settings"

### Paso 2: Agregar TestSprite como servidor MCP

En la configuración de MCP, agrega:

```json
{
  "mcpServers": {
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"],
      "env": {
        "TESTSPRITE_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

### Paso 3: Configurar la API Key

Opción A - Desde el archivo de configuración:
```json
"env": {
  "TESTSPRITE_API_KEY": "sk-user-tIUvl9HIvQI2ywBzVc2KU2Z84CHV2MzgcWbsmyE4t27JSUIwEXKEnoFcfzgaowcBZZp0QmSvia7TaYNaAYXWO3CRARpBFzg0i3S4IG58578lh21ahsJcJzcwp2BknZYKSSk"
}
```

Opción B - Usar variable de entorno del sistema:
```json
"env": {
  "TESTSPRITE_API_KEY": "${env:TESTSPRITE_API_KEY}"
}
```

### Paso 4: Reiniciar Cursor

1. Cierra Cursor completamente
2. Ábrelo de nuevo
3. El servidor MCP de TestSprite debería iniciarse automáticamente

### Paso 5: Verificar instalación

1. Abre el chat de Cursor (Cmd/Ctrl + L)
2. Escribe: "List available MCP servers"
3. Deberías ver "testsprite" en la lista
4. Prueba con: "Test this project with TestSprite"

---

## 🟣 Otros IDEs (JetBrains, etc.)

### Para IDEs que soporten MCP

La mayoría de IDEs modernos están agregando soporte para MCP. El proceso general es:

1. **Buscar la extensión/plugin de MCP** para tu IDE
2. **Instalar la extensión**
3. **Configurar el servidor TestSprite** con la misma configuración JSON
4. **Reiniciar el IDE**

### Configuración genérica de MCP

```json
{
  "mcpServers": {
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"],
      "env": {
        "TESTSPRITE_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

---

## 🔧 Instalación Manual (Sin MCP)

Si tu IDE no soporta MCP, puedes usar TestSprite de otras formas:

### Opción 1: CLI Standalone

```powershell
# Instalar TestSprite CLI globalmente
npm install -g testsprite-cli

# Configurar API key
testsprite config set apiKey tu_api_key_aqui

# Ejecutar pruebas
cd parking-backend
testsprite run --suite=api
```

### Opción 2: Dashboard Web

1. Ve a [testsprite.com/dashboard](https://testsprite.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona "New Test Run"
4. Conecta tu repositorio o sube los archivos
5. Ejecuta las pruebas desde el dashboard

### Opción 3: Integración directa en package.json

Ya tienes los scripts configurados:

```powershell
# Backend
cd parking-backend
npm run test:testsprite:api

# Frontend
cd parking-frontend
npm run test:testsprite:e2e
```

---

## ✅ Verificación de Instalación

### Verificar que MCP está funcionando

#### En VS Code:
1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Busca "MCP: Show Server Status"
3. Deberías ver "testsprite" con estado "Running"

#### En Cursor:
1. Abre el chat (Cmd/Ctrl + L)
2. Escribe: "@mcp status"
3. Deberías ver el servidor TestSprite activo

### Probar TestSprite

Pregunta a tu asistente AI:

```
Test the health endpoint of my backend with TestSprite
```

O:

```
Run E2E tests on the login flow with TestSprite
```

---

## 🐛 Solución de Problemas

### Error: "MCP server failed to start"

**Causa**: Node.js no está en el PATH o npx no está disponible

**Solución**:
```powershell
# Verificar Node.js
node --version
npm --version

# Si no están disponibles, reinstala Node.js
# Descarga desde: https://nodejs.org
```

### Error: "TestSprite API key invalid"

**Causa**: La API key no está configurada correctamente

**Solución**:
1. Verifica tu API key en `.testspriterc`
2. Cópiala exactamente (sin espacios extra)
3. Pégala en la configuración de MCP
4. Reinicia el IDE

### Error: "Cannot find module @testsprite/mcp-server"

**Causa**: El paquete no se puede descargar automáticamente

**Solución**:
```powershell
# Instalar manualmente
npm install -g @testsprite/mcp-server

# Luego cambiar la configuración MCP a:
{
  "command": "testsprite-mcp-server",
  "args": []
}
```

### El servidor MCP se inicia pero no responde

**Causa**: Problemas de red o firewall

**Solución**:
1. Verifica tu conexión a internet
2. Revisa el firewall de Windows
3. Intenta con VPN desactivada
4. Revisa los logs del IDE

### Ver logs de MCP

#### VS Code:
1. View → Output
2. Selecciona "MCP" en el dropdown
3. Revisa los mensajes de error

#### Cursor:
1. Help → Toggle Developer Tools
2. Ve a la pestaña "Console"
3. Busca mensajes relacionados con MCP

---

## 📚 Recursos Adicionales

- **Documentación de MCP**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **TestSprite MCP Docs**: [docs.testsprite.com/mcp](https://docs.testsprite.com/mcp)
- **TestSprite Support**: support@testsprite.com

---

## 🎯 Próximos Pasos

Una vez instalado TestSprite MCP:

1. ✅ Verifica que el servidor esté corriendo
2. ✅ Prueba con un comando simple
3. ✅ Ejecuta las pruebas del proyecto
4. ✅ Revisa los reportes en el dashboard

**¿Necesitas ayuda?** Dime qué IDE estás usando y te guiaré paso a paso.
