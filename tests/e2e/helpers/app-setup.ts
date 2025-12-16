import { Express } from 'express';
import { createApp as createApiGateway } from '../../../packages/api-gateway/src/index';
import { createApp as createNumberService } from '../../../packages/number-service/src/index';
import { createApp as createBillingService } from '../../../packages/billing-service/src/index';
import { createApp as createNotificationService } from '../../../packages/notification-service/src/index';

export const setupTestApp = async (service?: string): Promise<Express> => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/voxlink_test';

  switch (service) {
    case 'number-service':
      return await createNumberService();
    case 'billing-service':
      return await createBillingService();
    case 'notification-service':
      return await createNotificationService();
    default:
      // Return API Gateway by default (which proxies to all services)
      return await createApiGateway();
  }
};

export const waitForService = async (app: Express, maxRetries = 10): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Try to make a health check request
      const request = require('supertest');
      await request(app).get('/health').expect(200);
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Service failed to start after ${maxRetries} retries`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};