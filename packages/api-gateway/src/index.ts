import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { securityMiddleware } from './middleware/security';
import { proxyMiddleware } from './middleware/proxy';
import { createPerformanceMonitoringMiddleware } from './middleware/performance-monitoring.middleware';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { apiKeyRouter } from './routes/api-keys';
import { createPerformanceRouter } from './routes/performance';
import { webSocketRouter } from './routes/websocket';
import { integrationsRouter } from './routes/integrations';
import { securityRouter } from './routes/security';
import { RedisService } from './services/redis.service';
import { AuthService } from './services/auth.service';
import { webSocketService } from './services/websocket.service';

// Import performance optimization system
import {
  getPerformanceMiddleware,
  performanceUtils,
  cacheUtils,
} from '@voxlink/shared';

const app = express();
const server = createServer(app);

// Initialize services
const redisService = new RedisService();
const authService = new AuthService(redisService);

// Initialize performance optimization system
async function initializePerformanceSystem() {
  try {
    // Note: performanceSystem exported as namespace from shared
    // await performanceSystem.initialize();
    logger.info('Performance optimization system skipped (not yet configured)');
  } catch (error) {
    logger.error('Failed to initialize performance system:', error as any);
    // Continue without performance optimization if it fails
  }
}

// Initialize security services
authService.initializeSecurity().catch(error => {
  logger.error('Failed to initialize security services:', error as any);
});

// Initialize WebSocket service
webSocketService.initialize(server);

// Initialize performance system
initializePerformanceSystem();

// Get performance middleware (with fallback if not initialized)
let perfMiddleware: any = null;
try {
  perfMiddleware = getPerformanceMiddleware();
} catch (error) {
  logger.warn('Performance middleware not available, continuing without optimization');
}

// Performance middleware - apply early for maximum benefit
if (perfMiddleware) {
  app.use(perfMiddleware.compression);
  app.use(perfMiddleware.responseTime);
  app.use(perfMiddleware.requestSizeLimit);
  app.use(perfMiddleware.cacheHeaders);
  app.use(perfMiddleware.conditionalRequests);
  app.use(perfMiddleware.staticAssets);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Additional security headers from performance middleware
if (perfMiddleware) {
  app.use(perfMiddleware.security);
}

app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
}));

// Performance monitoring
app.use(createPerformanceMonitoringMiddleware());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Security middleware
app.use(securityMiddleware);

// API optimization for JSON responses
if (perfMiddleware) {
  app.use('/api', perfMiddleware.apiOptimization);
}

// Caching middleware for different routes
if (perfMiddleware && perfMiddleware.cache) {
  // Cache number search results with short TTL
  app.use('/api/v1/numbers/search', perfMiddleware.cache.shortTerm);
  app.use('/api/v1/numbers/available', perfMiddleware.cache.mediumTerm);

  // Cache analytics and reports with longer TTL
  app.use('/api/v1/analytics', perfMiddleware.cache.analytics);

  // Cache static content
  app.use('/static', perfMiddleware.cache.staticContent);
}

// Health check (no auth required) - enhanced with performance metrics
app.use('/health', healthRouter);

// Authentication routes
app.use('/auth', authRouter(authService));

// API key management routes
app.use('/api-keys', authMiddleware(authService), apiKeyRouter(authService));

// Performance monitoring routes (admin only)
app.use('/performance', authMiddleware(authService), createPerformanceRouter());

// WebSocket management routes (admin only)
app.use('/websocket', authMiddleware(authService), webSocketRouter);

// Security management routes (admin only)
app.use('/security', authMiddleware(authService), securityRouter(authService));

// Performance optimization endpoints (admin only)
app.post('/api/admin/optimize', authMiddleware(authService), async (req, res) => {
  try {
    // if (performanceSystem) {
    //   const performanceService = performanceSystem.getService();
    //   const result = await performanceService.optimizePerformance();
    // }
    // Performance system methods not available, return placeholder
    res.json({
      success: true,
      message: 'Performance optimization not available',
      result: {},
    });
  } catch (error) {
    logger.error('Optimization failed:', error as any);
    res.status(500).json({
      error: {
        code: 'OPTIMIZATION_ERROR',
        message: 'Performance optimization failed',
      },
    });
  }
});

// Cache management endpoints (admin only)
app.post('/api/admin/cache/warm', authMiddleware(authService), async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Entries must be an array' });
    }

    await cacheUtils.warm(entries);

    res.json({
      success: true,
      message: `Cache warmed with ${entries.length} entries`,
    });
  } catch (error) {
    logger.error('Cache warming failed:', error as any);
    res.status(500).json({
      success: false,
      error: 'Cache warming failed',
    });
  }
});

app.post('/api/admin/cache/invalidate', authMiddleware(authService), async (req, res) => {
  try {
    const { pattern } = req.body;
    if (!pattern) {
      return res.status(400).json({ error: 'Pattern is required' });
    }

    await cacheUtils.invalidate(pattern);

    res.json({
      success: true,
      message: `Cache invalidated for pattern: ${pattern}`,
    });
  } catch (error) {
    logger.error('Cache invalidation failed:', error as any);
    res.status(500).json({
      success: false,
      error: 'Cache invalidation failed',
    });
  }
});

// Integrations routes
app.use('/api/v1/integrations',
  rateLimitMiddleware('analytics'), // Use analytics rate limit as fallback
  authMiddleware(authService),
  integrationsRouter
);

// Service proxying with authentication and performance monitoring
app.use('/api/v1/numbers',
  rateLimitMiddleware('numbers'),
  authMiddleware(authService),
  (req, res, next) => {
    performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'number-service' });
    next();
  },
  proxyMiddleware(config.services.numberService)
);

app.use('/api/v1/billing',
  rateLimitMiddleware('billing'),
  authMiddleware(authService),
  (req, res, next) => {
    performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'billing-service' });
    next();
  },
  proxyMiddleware(config.services.billingService)
);

app.use('/api/v1/notifications',
  rateLimitMiddleware('notifications'),
  authMiddleware(authService),
  (req, res, next) => {
    performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'notification-service' });
    next();
  },
  proxyMiddleware(config.services.notificationService)
);

app.use('/api/v1/analytics',
  rateLimitMiddleware('analytics'),
  authMiddleware(authService),
  (req, res, next) => {
    performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'analytics-service' });
    next();
  },
  proxyMiddleware(config.services.analyticsService)
);

app.use('/api/v1/ai-agents',
  rateLimitMiddleware('ai-agents'),
  authMiddleware(authService),
  (req, res, next) => {
    performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'ai-agent-service' });
    next();
  },
  proxyMiddleware(config.services.aiAgentService)
);

app.use('/api/v1/voice-workflows',
  rateLimitMiddleware('voice-workflows'),
  authMiddleware(authService),
  (req, res, next) => {
    performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'ai-agent-service' });
    next();
  },
  proxyMiddleware(config.services.aiAgentService)
);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist',
      path: req.originalUrl,
      method: req.method,
    },
  });
});

// Error handling
app.use(errorHandler);

// Graceful shutdown with performance system cleanup
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(async () => {
    try {
      await redisService.disconnect();
      // if (performanceSystem) {
      //   await performanceSystem.shutdown();
      //   logger.info('Performance system shut down');
      // }
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error as any);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(async () => {
    try {
      await redisService.disconnect();
      // if (performanceSystem) {
      //   await performanceSystem.shutdown();
      //   logger.info('Performance system shut down');
      // }
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error as any);
      process.exit(1);
    }
  });
});

const PORT = config.port || 3001;

server.listen(PORT, () => {
  logger.info(`API Gateway with WebSocket running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`CORS origins: ${config.cors.allowedOrigins.join(', ')}`);
  logger.info(`WebSocket service initialized and ready for connections`);
});

export default app;
