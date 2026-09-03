import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import config from './config';
import logger from './logger/winston.logger';
import requestLogger from './logger/request.logger';
import apiRouter from './routes';
import { globalErrorHandler } from './errors/error.middleware';
import { NotFoundError } from './errors/app-error';

const app = express();

// --- 1. Global Middlewares ---
// Standard HTTP headers security enhancement
app.use(helmet());

// Enable Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  config.CORS_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev mode
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  }),
);

// Compress response bodies for enhanced transmission performance
app.use(compression());

// Parse JSON request payloads
app.use(express.json());

// Parse URL-encoded bodies (form submits)
app.use(express.urlencoded({ extended: true }));

// Parse HttpOnly cookie tokens
app.use(cookieParser());

// Log incoming request details
app.use(requestLogger);

// Silent 204 handler for browser favicon requests
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Root welcome & service health info endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'Capacity Connect Enterprise API',
    status: 'online',
    version: '1.0.0',
    environment: config.NODE_ENV,
    apiPrefix: config.API_PREFIX,
    endpoints: {
      health: `${config.API_PREFIX}/health`,
      auth: `${config.API_PREFIX}/auth`,
      users: `${config.API_PREFIX}/users`,
    },
  });
});

// --- 2. REST Endpoints ---
app.use(config.API_PREFIX, apiRouter);

// Fallback Route for handling unmatched endpoints (404)
app.all('*', (req, _res, next) => {
  next(
    new NotFoundError(`Requested endpoint (${req.method} ${req.originalUrl}) could not be found`),
  );
});

// --- 3. Global Error Handling ---
app.use(globalErrorHandler);

// --- 4. Server Initialization ---
const server = app.listen(config.PORT, () => {
  logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  logger.info(`👉 API endpoints exposed at: http://localhost:${config.PORT}${config.API_PREFIX}`);
});

// Handle uncaught exceptions and unhandled rejections gracefully
process.on('uncaughtException', (err: Error) => {
  logger.error('CRITICAL: Uncaught Exception thrown!', err);
  logger.info('Shutting down server...');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('CRITICAL: Unhandled Promise Rejection detected!', reason as Error);
  logger.info('Shutting down server...');
  server.close(() => {
    process.exit(1);
  });
});
