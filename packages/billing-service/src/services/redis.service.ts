import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class RedisService {
  private static client: RedisClientType | null = null;

  static async initialize(): Promise<void> {
    try {
      this.client = createClient({
        url: config.redis.url,
      });

      this.client.on('error', (error) => {
        logger.error('Redis error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
      });

      this.client.on('disconnect', () => {
        logger.info('Redis disconnected');
      });

      await this.client.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis not initialized. Call RedisService.initialize() first.');
    }
    return this.client;
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      logger.info('Redis disconnected');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Utility methods for common operations
  static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  static async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return client.get(key);
  }

  static async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }
}
