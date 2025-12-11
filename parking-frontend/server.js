const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Nombre de tu proyecto (carpeta dentro de dist/)
const distFolder = 'parking-frontend';

// Servir archivos estáticos desde dist
app.use(express.static(path.join(__dirname, 'dist', distFolder)));

// Redirigir todas las rutas a index.html (para Angular routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', distFolder, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});