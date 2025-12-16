import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health';
import { notificationsRouter } from './routes/notifications';
import { DatabaseService } from './services/database.service';
import { TemplateService } from './services/template.service';

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check (before authentication)
  app.use('/health', healthRouter);

  // API routes
  app.use('/api/v1/notifications', notificationsRouter);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Initialize WebSocket if enabled
  let io: Server | null = null;
  if (config.websocket.enabled) {
    io = new Server(server, {
      cors: config.websocket.cors,
    });

    io.on('connection', (socket) => {
      logger.info('WebSocket client connected', { socketId: socket.id });

      socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`);
        logger.debug('User joined notification room', { userId, socketId: socket.id });
      });

      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', { socketId: socket.id });
      });
    });

    logger.info('WebSocket server initialized');
  }

  // Initialize services
  try {
    await DatabaseService.initialize();

    // Initialize default templates
    const prisma = DatabaseService.getClient();
    const templateService = new TemplateService(prisma);
    await templateService.initializeDefaultTemplates();

    logger.info('Database connection and templates initialized');
  } catch (error: any) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }

  // Start server
  const port = config.server.port;
  server.listen(port, () => {
    logger.info(`Notification Service running on port ${port}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`WebSocket enabled: ${config.websocket.enabled}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);

    // Close WebSocket server
    if (io) {
      io.close();
    }

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close database connection
    await DatabaseService.disconnect();

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    process.exit(1);
  });

  return { app, server, io };
}

startServer().catch((error: any) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});