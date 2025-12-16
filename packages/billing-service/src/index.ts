import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { healthRouter } from './routes/health';
import { billingRouter } from './routes/billing';
import { webhooksRouter } from './routes/webhooks';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { BillingJobs } from './jobs/billing-jobs';

async function startServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
  }));

  // Webhook routes need raw body for signature verification
  app.use('/webhooks', express.raw({ type: 'application/json' }));
  app.use('/webhooks', webhooksRouter);

  // Body parsing middleware for other routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use(requestLogger);

  // Health check (before authentication)
  app.use('/health', healthRouter);

  // API routes
  app.use('/api/v1/billing', billingRouter);

  // Serve static files (PDFs)
  app.use('/invoices', express.static(config.pdf.storagePath));

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Initialize services
  try {
    await DatabaseService.initialize();
    await RedisService.initialize();
    
    logger.info('Database and Redis connections established');
  } catch (error) {
    logger.error('Failed to initialize services:', error as any);
    process.exit(1);
  }

  // Start scheduled jobs
  const billingJobs = new BillingJobs();
  billingJobs.start();

  // Start server
  const port = config.server.port;
  const server = app.listen(port, () => {
    logger.info(`Billing Service running on port ${port}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`PDF storage: ${config.pdf.storagePath}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Stop scheduled jobs
    billingJobs.stop();

    // Close database and Redis connections
    await DatabaseService.disconnect();
    await RedisService.disconnect();

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    process.exit(1);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error as any);
  process.exit(1);
});
