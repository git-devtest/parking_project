const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

/**
 * @description Importa las rutas
 * @module routes
 */
const vehicleRoutes = require('./routes/vehicleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const auditRoutes = require('./routes/auditRoutes');
const userRoutes = require('./routes/userRoutes');
const backupRoutes = require('./routes/backupRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

// Configuración CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://web-93ycjjsy1zjz.up-de-fra1-k8s-1.apps.run-on-seenode.com'
    : ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

/**
 * @description Limita el número de solicitudes
 * @module rateLimit
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP'
  }
});

/**
 * @description Middleware
 * @module middleware
 */
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));

// Cargar el archivo swagger.yml
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger/swagger.yml'));

// Ruta de documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customSiteTitle: "API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true
  }
}));

/**
 * @description Health check
 * @module healthCheck
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servicio funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * @description Rutas
 * @module routes
 */
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/info', aboutRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/tickets', ticketRoutes);

/**
 * @description Error handling
 * @module errorHandling
 */
app.use(notFound);
app.use(errorHandler);

/**
 * @description Exporta la aplicación
 * @module app
 */
module.exports = app;