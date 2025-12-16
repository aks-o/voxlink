"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            socket: {
                host: config_1.config.redis.host,
                port: config_1.config.redis.port,
            },
            password: config_1.config.redis.password,
            database: config_1.config.redis.db,
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Redis client error:', error);
        });
        this.client.on('connect', () => {
            logger_1.logger.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('disconnect', () => {
            logger_1.logger.warn('Redis client disconnected');
            this.isConnected = false;
        });
        this.connect();
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis:', error);
            // Retry connection after 5 seconds
            setTimeout(() => this.connect(), 5000);
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await this.client.disconnect();
        }
    }
    getKey(key) {
        return `${config_1.config.redis.keyPrefix}${key}`;
    }
    async get(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping get operation');
                return null;
            }
            return await this.client.get(this.getKey(key));
        }
        catch (error) {
            logger_1.logger.error('Redis get error:', error);
            return null;
        }
    }
    async set(key, value) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping set operation');
                return false;
            }
            await this.client.set(this.getKey(key), value);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis set error:', error);
            return false;
        }
    }
    async setex(key, seconds, value) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping setex operation');
                return false;
            }
            await this.client.setEx(this.getKey(key), seconds, value);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis setex error:', error);
            return false;
        }
    }
    async del(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping del operation');
                return false;
            }
            await this.client.del(this.getKey(key));
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis del error:', error);
            return false;
        }
    }
    async exists(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping exists operation');
                return false;
            }
            const result = await this.client.exists(this.getKey(key));
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis exists error:', error);
            return false;
        }
    }
    async incr(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping incr operation');
                return 0;
            }
            return await this.client.incr(this.getKey(key));
        }
        catch (error) {
            logger_1.logger.error('Redis incr error:', error);
            return 0;
        }
    }
    async expire(key, seconds) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping expire operation');
                return false;
            }
            await this.client.expire(this.getKey(key), seconds);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis expire error:', error);
            return false;
        }
    }
    async ttl(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping ttl operation');
                return -1;
            }
            return await this.client.ttl(this.getKey(key));
        }
        catch (error) {
            logger_1.logger.error('Redis ttl error:', error);
            return -1;
        }
    }
    // Rate limiting helpers
    async incrementRateLimit(key, windowMs) {
        const rateLimitKey = `rate_limit:${key}`;
        const current = await this.incr(rateLimitKey);
        if (current === 1) {
            await this.expire(rateLimitKey, Math.ceil(windowMs / 1000));
        }
        return current;
    }
    async getRateLimit(key) {
        const rateLimitKey = `rate_limit:${key}`;
        const count = parseInt(await this.get(rateLimitKey) || '0', 10);
        const ttl = await this.ttl(rateLimitKey);
        return { count, ttl };
    }
    // Session management
    async createSession(sessionId, userId, data) {
        const sessionKey = `session:${sessionId}`;
        const sessionData = {
            userId,
            ...data,
            createdAt: new Date().toISOString(),
        };
        return await this.setex(sessionKey, config_1.config.security.sessionTimeout / 1000, JSON.stringify(sessionData));
    }
    async getSession(sessionId) {
        const sessionKey = `session:${sessionId}`;
        const data = await this.get(sessionKey);
        if (data) {
            try {
                return JSON.parse(data);
            }
            catch (error) {
                logger_1.logger.error('Failed to parse session data:', error);
                return null;
            }
        }
        return null;
    }
    async deleteSession(sessionId) {
        const sessionKey = `session:${sessionId}`;
        return await this.del(sessionKey);
    }
    async extendSession(sessionId) {
        const sessionKey = `session:${sessionId}`;
        return await this.expire(sessionKey, config_1.config.security.sessionTimeout / 1000);
    }
    // Health check
    async ping() {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis ping error:', error);
            return false;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
}
exports.RedisService = RedisService;
