"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class DatabaseService {
    static async initialize() {
        try {
            this.client = new client_1.PrismaClient({
                log: [
                    { level: 'query', emit: 'event' },
                    { level: 'error', emit: 'event' },
                    { level: 'info', emit: 'event' },
                    { level: 'warn', emit: 'event' },
                ],
            });
            // Log database queries in development
            if (process.env.NODE_ENV === 'development') {
                this.client.$on('query', (e) => {
                    logger_1.logger.debug('Database query', {
                        query: e.query,
                        params: e.params,
                        duration: `${e.duration}ms`,
                    });
                });
            }
            this.client.$on('error', (e) => {
                logger_1.logger.error('Database error', { error: e.message });
            });
            await this.client.$connect();
            logger_1.logger.info('Database connected successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to database', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static getClient() {
        if (!this.client) {
            throw new Error('Database not initialized. Call DatabaseService.initialize() first.');
        }
        return this.client;
    }
    static async disconnect() {
        if (this.client) {
            await this.client.$disconnect();
            this.client = null;
            logger_1.logger.info('Database disconnected');
        }
    }
    static async healthCheck() {
        try {
            if (!this.client) {
                return false;
            }
            await this.client.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_1.logger.error('Database health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}
exports.DatabaseService = DatabaseService;
DatabaseService.client = null;
