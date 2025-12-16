import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'notification-service',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: false,
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

  // Determine overall health status
  const isHealthy = health.checks.database;
  health.status = isHealthy ? 'healthy' : 'unhealthy';

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});