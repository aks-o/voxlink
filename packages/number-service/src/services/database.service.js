"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class DatabaseServiceClass {
    constructor() {
        this.prisma = null;
    }
    async initialize() {
        try {
            this.prisma = new client_1.PrismaClient({
                datasources: {
                    db: {
                        url: config_1.config.env === 'test' ? config_1.config.database.testUrl : config_1.config.database.url,
                    },
                },
                log: config_1.config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
            });
            // Test the connection
            await this.prisma.$connect();
            logger_1.logger.info('Database connection established');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.prisma) {
            await this.prisma.$disconnect();
            this.prisma = null;
            logger_1.logger.info('Database connection closed');
        }
    }
    getClient() {
        if (!this.prisma) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.prisma;
    }
    async healthCheck() {
        try {
            if (!this.prisma) {
                return false;
            }
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            return false;
        }
    }
    async runMigrations() {
        try {
            if (!this.prisma) {
                throw new Error('Database not initialized');
            }
            // In production, migrations should be run separately
            if (config_1.config.env !== 'production') {
                logger_1.logger.info('Running database migrations...');
                // Migrations are handled by Prisma CLI in development
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to run migrations:', error);
            throw error;
        }
    }
}
exports.DatabaseService = new DatabaseServiceClass();
