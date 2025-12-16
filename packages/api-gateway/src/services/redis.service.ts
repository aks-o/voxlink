import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.db,
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', { error } as any);
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });

    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', { error } as any);
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  private getKey(key: string): string {
    return `${config.redis.keyPrefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping get operation');
        return null;
      }
      return await this.client.get(this.getKey(key));
    } catch (error) {
      logger.error('Redis get error:', { error } as any);
      return null;
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping set operation');
        return false;
      }
      await this.client.set(this.getKey(key), value);
      return true;
    } catch (error) {
      logger.error('Redis set error:', { error } as any);
      return false;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping setex operation');
        return false;
      }
      await this.client.setEx(this.getKey(key), seconds, value);
      return true;
    } catch (error) {
      logger.error('Redis setex error:', { error } as any);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping del operation');
        return false;
      }
      await this.client.del(this.getKey(key));
      return true;
    } catch (error) {
      logger.error('Redis del error:', { error } as any);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping exists operation');
        return false;
      }
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', { error } as any);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping incr operation');
        return 0;
      }
      return await this.client.incr(this.getKey(key));
    } catch (error) {
      logger.error('Redis incr error:', { error } as any);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping expire operation');
        return false;
      }
      await this.client.expire(this.getKey(key), seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', { error } as any);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping ttl operation');
        return -1;
      }
      return await this.client.ttl(this.getKey(key));
    } catch (error) {
      logger.error('Redis ttl error:', { error } as any);
      return -1;
    }
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping lpush operation');
        return 0;
      }
      return await this.client.lPush(this.getKey(key), value);
    } catch (error) {
      logger.error('Redis lpush error:', { error } as any);
      return 0;
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping ltrim operation');
        return false;
      }
      await this.client.lTrim(this.getKey(key), start, stop);
      return true;
    } catch (error) {
      logger.error('Redis ltrim error:', { error } as any);
      return false;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping lrange operation');
        return [];
      }
      return await this.client.lRange(this.getKey(key), start, stop);
    } catch (error) {
      logger.error('Redis lrange error:', { error } as any);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping sadd operation');
        return 0;
      }
      return await this.client.sAdd(this.getKey(key), member);
    } catch (error) {
      logger.error('Redis sadd error:', { error } as any);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping smembers operation');
        return [];
      }
      return await this.client.sMembers(this.getKey(key));
    } catch (error) {
      logger.error('Redis smembers error:', { error } as any);
      return [];
    }
  }

  // Rate limiting helpers
  async incrementRateLimit(key: string, windowMs: number): Promise<number> {
    const rateLimitKey = `rate_limit:${key}`;
    const current = await this.incr(rateLimitKey);

    if (current === 1) {
      await this.expire(rateLimitKey, Math.ceil(windowMs / 1000));
    }

    return current;
  }

  async getRateLimit(key: string): Promise<{ count: number; ttl: number }> {
    const rateLimitKey = `rate_limit:${key}`;
    const count = parseInt(await this.get(rateLimitKey) || '0', 10);
    const ttl = await this.ttl(rateLimitKey);

    return { count, ttl };
  }

  // Session management
  async createSession(sessionId: string, userId: string, data: any): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = {
      userId,
      ...data,
      createdAt: new Date().toISOString(),
    };

    return await this.setex(
      sessionKey,
      config.security.sessionTimeout / 1000,
      JSON.stringify(sessionData)
    );
  }

  async getSession(sessionId: string): Promise<any | null> {
    const sessionKey = `session:${sessionId}`;
    const data = await this.get(sessionKey);

    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        logger.error('Failed to parse session data:', { error } as any);
        return null;
      }
    }

    return null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    return await this.del(sessionKey);
  }

  async extendSession(sessionId: string): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    return await this.expire(sessionKey, config.security.sessionTimeout / 1000);
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', { error } as any);
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}