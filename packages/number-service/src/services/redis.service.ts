import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

class RedisServiceClass {
  private client: RedisClientType | null = null;

  async initialize(): Promise<void> {
    try {
      this.client = createClient({
        url: config.redis.url,
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error as any);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('disconnect', () => {
        logger.info('Redis client disconnected');
      });

      await this.client.connect();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error as any);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      logger.info('Redis connection closed');
    }
  }

  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis not initialized. Call initialize() first.');
    }
    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error as any);
      return false;
    }
  }

  // Cache utility methods
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) {
        return null;
      }

      const fullKey = `${config.redis.keyPrefix}${key}`;
      const value = await this.client.get(fullKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to get cache key ${key}:`, error as any);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      const fullKey = `${config.redis.keyPrefix}${key}`;
      const serializedValue = JSON.stringify(value);
      const ttl = ttlSeconds || config.redis.defaultTtl;

      await this.client.setEx(fullKey, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error(`Failed to set cache key ${key}:`, error as any);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      const fullKey = `${config.redis.keyPrefix}${key}`;
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      logger.error(`Failed to delete cache key ${key}:`, error as any);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      const fullKey = `${config.redis.keyPrefix}${key}`;
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error) {
      logger.error(`Failed to check cache key ${key}:`, error as any);
      return false;
    }
  }

  async setWithExpiry(key: string, value: any, expiryDate: Date): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      const fullKey = `${config.redis.keyPrefix}${key}`;
      const serializedValue = JSON.stringify(value);
      const ttlSeconds = Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / 1000));

      if (ttlSeconds <= 0) {
        return false; // Already expired
      }

      await this.client.setEx(fullKey, ttlSeconds, serializedValue);
      return true;
    } catch (error) {
      logger.error(`Failed to set cache key ${key} with expiry:`, error as any);
      return false;
    }
  }
}

export const RedisService = new RedisServiceClass();
