import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { healthRouter } from './routes/health';
import { numbersRouter } from './routes/numbers';
import { activationRouter } from './routes/activation';
import { configurationRouter } from './routes/configuration';
import { dashboardRouter } from './routes/dashboard';
import { portingRouter } from './routes/porting';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';

async function startServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use(requestLogger);

  // Health check (before authentication)
  app.use('/health', healthRouter);

  // API routes
  app.use('/api/v1/numbers', numbersRouter);
  app.use('/api/v1/activation', activationRouter);
  app.use('/api/v1/configuration', configurationRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/porting', portingRouter);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Initialize services
  try {
    await DatabaseService.initialize();
    await RedisService.initialize();
    
    logger.info('Database and Redis connections established');
  } catch (error) {
    logger.error('Failed to initialize services:', error as any);
    logger.warn('Continuing without database/Redis for testing purposes');
    // In development, we can continue without DB for basic API testing
    // process.exit(1);
  }

  // Start server
  const port = config.server.port;
  app.listen(port, () => {
    logger.info(`Number Management Service running on port ${port}`);
    logger.info(`Environment: ${config.env}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await DatabaseService.disconnect();
    await RedisService.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await DatabaseService.disconnect();
    await RedisService.disconnect();
    process.exit(0);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error as any);
  process.exit(1);
});
