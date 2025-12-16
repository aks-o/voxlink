import { Router } from 'express';
import { HealthCheckManager, commonHealthChecks } from '@voxlink/shared';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';

export const healthRouter = Router();

// Create health check manager for Number Service
const healthManager = new HealthCheckManager('number-service');

// Register health checks
healthManager.register('memory', commonHealthChecks.memory(512)); // 512MB limit

healthManager.register('database', commonHealthChecks.database(async () => {
  return await DatabaseService.healthCheck();
}));

healthManager.register('redis', commonHealthChecks.redis(async () => {
  return await RedisService.healthCheck();
}));

// Health check endpoints
healthRouter.get('/', healthManager.healthEndpoint());
healthRouter.get('/detailed', healthManager.healthEndpoint());
healthRouter.get('/ready', healthManager.readinessEndpoint(['database', 'redis']));
healthRouter.get('/live', healthManager.livenessEndpoint());