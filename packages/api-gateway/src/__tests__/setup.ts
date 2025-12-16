// Test setup file
import { config } from '../config/config';

// Override config for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.REDIS_HOST = 'localhost';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock Redis for tests
jest.mock('../services/redis.service', () => {
  return {
    RedisService: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      setex: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(true),
      exists: jest.fn().mockResolvedValue(false),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(true),
      ttl: jest.fn().mockResolvedValue(-1),
      incrementRateLimit: jest.fn().mockResolvedValue(1),
      getRateLimit: jest.fn().mockResolvedValue({ count: 1, ttl: 3600 }),
      createSession: jest.fn().mockResolvedValue(true),
      getSession: jest.fn().mockResolvedValue(null),
      deleteSession: jest.fn().mockResolvedValue(true),
      extendSession: jest.fn().mockResolvedValue(true),
      ping: jest.fn().mockResolvedValue(true),
      getConnectionStatus: jest.fn().mockReturnValue(true),
      disconnect: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Global test timeout
jest.setTimeout(10000);