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
const { checkDatabaseHealth } = require('./config/database');

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

// Configuración CORS más robusta
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://web-93ycjjsy1zjz.up-de-fra1-k8s-1.apps.run-on-seenode.com'
];

// Configuración CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests sin origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Origin rechazado:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// ⭐ Versión para tracking
const APP_VERSION = '1.0.0'; 
console.log(`🚀 Iniciando backend v${APP_VERSION}`);

/**
 * @description Health check
 * @module healthCheck
 * @returns {Object} Estado de la aplicación
 */
app.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();

  // Calcular uptime en formato legible
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

  // Determinar el status code según el estado de la DB
  const statusCode = dbHealth.status === 'connected' ? 200 : 503;
  const isHealthy = dbHealth.status === 'connected';

  res.status(statusCode).json({
    success: isHealthy,
    message: isHealthy ? 'Servicio funcionando correctamente' : 'Servicio no disponible',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: uptimeFormatted ,
    database: {
      status: dbHealth.status,
      responseTime: dbHealth.responseTime ? `${dbHealth.responseTime}ms` : null,
      ...(dbHealth.error && { error: dbHealth.error })
    },
    system: {
      memory: `${Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)}%`,
      platform: process.platform,
      nodeVersion: process.version
    }
  });
});

/**
 * @description Health check detallado para monitoreo interno
 * @route GET /health/detailed
 */
app.get('/health/detailed', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  const uptimeSeconds = process.uptime();
  const memoryUsage = process.memoryUsage();

  const healthData = {
    service: {
      status: dbHealth.status === 'connected' ? 'operational' : 'degraded',
      version: APP_VERSION,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptimeSeconds),
        formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${Math.floor(uptimeSeconds % 60)}s`
      }
    },
    database: {
      status: dbHealth.status,
      responseTime: dbHealth.responseTime ? `${dbHealth.responseTime}ms` : null,
      ...(dbHealth.pool && {
        pool: {
          total: dbHealth.pool.total,
          idle: dbHealth.pool.idle,
          waiting: dbHealth.pool.waiting
        }
      }),
      ...(dbHealth.error && { error: dbHealth.error })
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        percentage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`
      },
      cpu: process.cpuUsage()
    }
  };

  const statusCode = dbHealth.status === 'connected' ? 200 : 503;
  res.status(statusCode).json(healthData);
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