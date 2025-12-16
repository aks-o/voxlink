"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class RedisService {
    static async initialize() {
        try {
            this.client = (0, redis_1.createClient)({
                url: config_1.config.redis.url,
            });
            this.client.on('error', (error) => {
                logger_1.logger.error('Redis error', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            });
            this.client.on('connect', () => {
                logger_1.logger.info('Redis connected');
            });
            this.client.on('disconnect', () => {
                logger_1.logger.info('Redis disconnected');
            });
            await this.client.connect();
            logger_1.logger.info('Redis connected successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    static getClient() {
        if (!this.client) {
            throw new Error('Redis not initialized. Call RedisService.initialize() first.');
        }
        return this.client;
    }
    static async disconnect() {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
            logger_1.logger.info('Redis disconnected');
        }
    }
    static async healthCheck() {
        try {
            if (!this.client) {
                return false;
            }
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    // Utility methods for common operations
    static async set(key, value, ttlSeconds) {
        const client = this.getClient();
        if (ttlSeconds) {
            await client.setEx(key, ttlSeconds, value);
        }
        else {
            await client.set(key, value);
        }
    }
    static async get(key) {
        const client = this.getClient();
        return client.get(key);
    }
    static async del(key) {
        const client = this.getClient();
        await client.del(key);
    }
    static async exists(key) {
        const client = this.getClient();
        const result = await client.exists(key);
        return result === 1;
    }
}
exports.RedisService = RedisService;
RedisService.client = null;
