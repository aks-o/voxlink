import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static client: PrismaClient | null = null;

  static async initialize(): Promise<void> {
    try {
      this.client = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === 'development') {
        (this.client as any).$on('query', (e: any) => {
          logger.debug('Database query', {
            query: e.query,
            params: e.params,
            duration: parseInt(e.duration) || 0,
          });
        });
      }

      (this.client as any).$on('error', (e: any) => {
        logger.error('Database error', { error: e.message });
      });

      await this.client.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static getClient(): PrismaClient {
    if (!this.client) {
      throw new Error('Database not initialized. Call DatabaseService.initialize() first.');
    }
    return this.client;
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.client = null;
      logger.info('Database disconnected');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}
