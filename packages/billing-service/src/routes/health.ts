import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'billing-service',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: false,
      redis: false,
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
    },
  };

  try {
    // Check database connection
    health.checks.database = await DatabaseService.healthCheck();
  } catch (error) {
    health.checks.database = false;
  }

  try {
    // Check Redis connection
    health.checks.redis = await RedisService.healthCheck();
  } catch (error) {
    health.checks.redis = false;
  }

  // Determine overall health status
  const isHealthy = health.checks.database && health.checks.redis;
  health.status = isHealthy ? 'healthy' : 'unhealthy';

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});