"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class RedisServiceClass {
    constructor() {
        this.client = null;
    }
    async initialize() {
        try {
            this.client = (0, redis_1.createClient)({
                url: config_1.config.redis.url,
            });
            this.client.on('error', (error) => {
                logger_1.logger.error('Redis client error:', error);
            });
            this.client.on('connect', () => {
                logger_1.logger.info('Redis client connected');
            });
            this.client.on('disconnect', () => {
                logger_1.logger.info('Redis client disconnected');
            });
            await this.client.connect();
            logger_1.logger.info('Redis connection established');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
            logger_1.logger.info('Redis connection closed');
        }
    }
    getClient() {
        if (!this.client) {
            throw new Error('Redis not initialized. Call initialize() first.');
        }
        return this.client;
    }
    async healthCheck() {
        try {
            if (!this.client) {
                return false;
            }
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', error);
            return false;
        }
    }
    // Cache utility methods
    async get(key) {
        try {
            if (!this.client) {
                return null;
            }
            const fullKey = `${config_1.config.redis.keyPrefix}${key}`;
            const value = await this.client.get(fullKey);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get cache key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (!this.client) {
                return false;
            }
            const fullKey = `${config_1.config.redis.keyPrefix}${key}`;
            const serializedValue = JSON.stringify(value);
            const ttl = ttlSeconds || config_1.config.redis.defaultTtl;
            await this.client.setEx(fullKey, ttl, serializedValue);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Failed to set cache key ${key}:`, error);
            return false;
        }
    }
    async delete(key) {
        try {
            if (!this.client) {
                return false;
            }
            const fullKey = `${config_1.config.redis.keyPrefix}${key}`;
            const result = await this.client.del(fullKey);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete cache key ${key}:`, error);
            return false;
        }
    }
    async exists(key) {
        try {
            if (!this.client) {
                return false;
            }
            const fullKey = `${config_1.config.redis.keyPrefix}${key}`;
            const result = await this.client.exists(fullKey);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error(`Failed to check cache key ${key}:`, error);
            return false;
        }
    }
    async setWithExpiry(key, value, expiryDate) {
        try {
            if (!this.client) {
                return false;
            }
            const fullKey = `${config_1.config.redis.keyPrefix}${key}`;
            const serializedValue = JSON.stringify(value);
            const ttlSeconds = Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / 1000));
            if (ttlSeconds <= 0) {
                return false; // Already expired
            }
            await this.client.setEx(fullKey, ttlSeconds, serializedValue);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Failed to set cache key ${key} with expiry:`, error);
            return false;
        }
    }
}
exports.RedisService = new RedisServiceClass();
