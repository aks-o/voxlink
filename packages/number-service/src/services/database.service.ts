import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';
import { logger } from '../utils/logger';

class DatabaseServiceClass {
    private prisma: PrismaClient | null = null;

    async initialize(): Promise<void> {
        try {
            this.prisma = new PrismaClient({
                datasources: {
                    db: {
                        url: config.env === 'test' ? config.database.testUrl : config.database.url,
                    },
                },
                log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
            });

            // Test the connection
            await this.prisma.$connect();
            logger.info('Database connection established');
        } catch (error) {
            logger.error('Failed to connect to database:', error as any);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.prisma) {
            await this.prisma.$disconnect();
            this.prisma = null;
            logger.info('Database connection closed');
        }
    }

    getClient(): PrismaClient {
        if (!this.prisma) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.prisma;
    }

    async healthCheck(): Promise<boolean> {
        try {
            if (!this.prisma) {
                return false;
            }

            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            logger.error('Database health check failed:', error as any);
            return false;
        }
    }

    async runMigrations(): Promise<void> {
        try {
            if (!this.prisma) {
                throw new Error('Database not initialized');
            }

            // In production, migrations should be run separately
            if (config.env !== 'production') {
                logger.info('Running database migrations...');
                // Migrations are handled by Prisma CLI in development
            }
        } catch (error) {
            logger.error('Failed to run migrations:', error as any);
            throw error;
        }
    }
}

export const DatabaseService = new DatabaseServiceClass();