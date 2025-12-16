"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("redis");
const logger_1 = require("../monitoring/logger");
const performance_monitor_service_1 = require("./performance-monitor.service");
class CacheService {
    constructor(config) {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            hitRate: 0,
        };
        this.isConnected = false;
        this.config = {
            defaultTtl: 3600, // 1 hour
            maxRetries: 3,
            retryDelay: 1000,
            keyPrefix: 'voxlink:',
            ...config,
        };
        this.client = (0, redis_1.createClient)({
            socket: {
                host: this.config.host,
                port: this.config.port,
            },
            password: this.config.password,
            database: this.config.database,
        });
        this.setupEventHandlers();
        this.startMetricsReporting();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.logger.info('Cache service connected to Redis');
            this.isConnected = true;
        });
        this.client.on('disconnect', () => {
            logger_1.logger.warn('Cache service disconnected from Redis');
            this.isConnected = false;
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Cache service Redis error:', error);
            this.stats.errors++;
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('Cache service reconnecting to Redis');
        });
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            logger_1.logger.error('Failed to connect cache service to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await this.client.disconnect();
        }
    }
    getKey(key) {
        return `${this.config.keyPrefix}${key}`;
    }
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
    async get(key) {
        if (!this.isConnected) {
            logger_1.logger.warn('Cache service not connected, skipping get operation');
            return null;
        }
        try {
            const fullKey = this.getKey(key);
            const value = await this.client.get(fullKey);
            if (value === null) {
                this.stats.misses++;
                this.updateHitRate();
                return null;
            }
            this.stats.hits++;
            this.updateHitRate();
            try {
                return JSON.parse(value);
            }
            catch (parseError) {
                logger_1.logger.warn('Failed to parse cached value:', parseError);
                return value;
            }
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', error);
            this.stats.errors++;
            return null;
        }
    }
    async set(key, value, options = {}) {
        if (!this.isConnected) {
            logger_1.logger.warn('Cache service not connected, skipping set operation');
            return false;
        }
        try {
            const fullKey = this.getKey(key);
            const ttl = options.ttl || this.config.defaultTtl;
            let serializedValue;
            if (typeof value === 'string') {
                serializedValue = value;
            }
            else {
                serializedValue = JSON.stringify(value);
            }
            // Compress if requested and value is large
            if (options.compress && serializedValue.length > 1024) {
                // In a real implementation, you'd use compression here
                logger_1.logger.debug('Compression requested for large cache value');
            }
            await this.client.setEx(fullKey, ttl, serializedValue);
            // Store tags for cache invalidation
            if (options.tags && options.tags.length > 0) {
                await this.addToTags(key, options.tags);
            }
            this.stats.sets++;
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', error);
            this.stats.errors++;
            return false;
        }
    }
    async delete(key) {
        if (!this.isConnected) {
            logger_1.logger.warn('Cache service not connected, skipping delete operation');
            return false;
        }
        try {
            const fullKey = this.getKey(key);
            const result = await this.client.del(fullKey);
            this.stats.deletes++;
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Cache delete error:', error);
            this.stats.errors++;
            return false;
        }
    }
    async exists(key) {
        if (!this.isConnected) {
            return false;
        }
        try {
            const fullKey = this.getKey(key);
            const result = await this.client.exists(fullKey);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Cache exists error:', error);
            return false;
        }
    }
    async mget(keys) {
        if (!this.isConnected || keys.length === 0) {
            return keys.map(() => null);
        }
        try {
            const fullKeys = keys.map(key => this.getKey(key));
            const values = await this.client.mGet(fullKeys);
            return values.map((value, index) => {
                if (value === null) {
                    this.stats.misses++;
                    return null;
                }
                this.stats.hits++;
                try {
                    return JSON.parse(value);
                }
                catch (parseError) {
                    logger_1.logger.warn(`Failed to parse cached value for key ${keys[index]}:`, parseError);
                    return value;
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Cache mget error:', error);
            this.stats.errors++;
            return keys.map(() => null);
        }
        finally {
            this.updateHitRate();
        }
    }
    async mset(keyValuePairs) {
        if (!this.isConnected || keyValuePairs.length === 0) {
            return false;
        }
        try {
            const pipeline = this.client.multi();
            for (const { key, value, options = {} } of keyValuePairs) {
                const fullKey = this.getKey(key);
                const ttl = options.ttl || this.config.defaultTtl;
                let serializedValue;
                if (typeof value === 'string') {
                    serializedValue = value;
                }
                else {
                    serializedValue = JSON.stringify(value);
                }
                pipeline.setEx(fullKey, ttl, serializedValue);
                // Handle tags
                if (options.tags && options.tags.length > 0) {
                    for (const tag of options.tags) {
                        const tagKey = this.getKey(`tag:${tag}`);
                        pipeline.sAdd(tagKey, key);
                    }
                }
            }
            await pipeline.exec();
            this.stats.sets += keyValuePairs.length;
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache mset error:', error);
            this.stats.errors++;
            return false;
        }
    }
    async invalidateByTag(tag) {
        if (!this.isConnected) {
            return 0;
        }
        try {
            const tagKey = this.getKey(`tag:${tag}`);
            const keys = await this.client.sMembers(tagKey);
            if (keys.length === 0) {
                return 0;
            }
            const fullKeys = keys.map(key => this.getKey(key));
            const pipeline = this.client.multi();
            // Delete all keys with this tag
            for (const fullKey of fullKeys) {
                pipeline.del(fullKey);
            }
            // Delete the tag set
            pipeline.del(tagKey);
            await pipeline.exec();
            this.stats.deletes += keys.length;
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error('Cache invalidateByTag error:', error);
            this.stats.errors++;
            return 0;
        }
    }
    async addToTags(key, tags) {
        const pipeline = this.client.multi();
        for (const tag of tags) {
            const tagKey = this.getKey(`tag:${tag}`);
            pipeline.sAdd(tagKey, key);
        }
        await pipeline.exec();
    }
    async increment(key, amount = 1) {
        if (!this.isConnected) {
            return 0;
        }
        try {
            const fullKey = this.getKey(key);
            return await this.client.incrBy(fullKey, amount);
        }
        catch (error) {
            logger_1.logger.error('Cache increment error:', error);
            this.stats.errors++;
            return 0;
        }
    }
    async expire(key, seconds) {
        if (!this.isConnected) {
            return false;
        }
        try {
            const fullKey = this.getKey(key);
            const result = await this.client.expire(fullKey, seconds);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Cache expire error:', error);
            this.stats.errors++;
            return false;
        }
    }
    async ttl(key) {
        if (!this.isConnected) {
            return -1;
        }
        try {
            const fullKey = this.getKey(key);
            return await this.client.ttl(fullKey);
        }
        catch (error) {
            logger_1.logger.error('Cache ttl error:', error);
            return -1;
        }
    }
    async flush() {
        if (!this.isConnected) {
            return false;
        }
        try {
            await this.client.flushDb();
            this.resetStats();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache flush error:', error);
            this.stats.errors++;
            return false;
        }
    }
    async ping() {
        if (!this.isConnected) {
            return false;
        }
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Cache ping error:', error);
            return false;
        }
    }
    getStats() {
        return { ...this.stats };
    }
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            hitRate: 0,
        };
    }
    isHealthy() {
        return this.isConnected && this.stats.hitRate > 50; // Consider healthy if hit rate > 50%
    }
    /**
     * Start reporting metrics to performance monitor
     */
    startMetricsReporting() {
        setInterval(() => {
            this.reportMetrics();
        }, 60000); // Report every minute
    }
    /**
     * Report cache metrics to performance monitor
     */
    reportMetrics() {
        const stats = this.getStats();
        performance_monitor_service_1.performanceMonitor.recordMetric('cache.hit_rate', stats.hitRate, 'percent');
        performance_monitor_service_1.performanceMonitor.recordMetric('cache.hits', stats.hits, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('cache.misses', stats.misses, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('cache.sets', stats.sets, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('cache.deletes', stats.deletes, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('cache.errors', stats.errors, 'count');
    }
    /**
     * Get cache performance metrics for the last period
     */
    async getPerformanceMetrics(periodMs = 300000) {
        const startTime = Date.now();
        const testKey = `perf_test_${startTime}`;
        const testValue = { test: true, timestamp: startTime };
        try {
            // Test set operation
            const setStart = Date.now();
            await this.set(testKey, testValue, { ttl: 60 });
            const setTime = Date.now() - setStart;
            // Test get operation
            const getStart = Date.now();
            await this.get(testKey);
            const getTime = Date.now() - getStart;
            // Clean up
            await this.delete(testKey);
            const avgResponseTime = (setTime + getTime) / 2;
            const throughput = this.stats.hits + this.stats.sets;
            const errorRate = this.stats.errors / Math.max(1, throughput) * 100;
            return {
                avgResponseTime,
                throughput,
                errorRate,
                memoryUsage: 0, // Would need Redis INFO command for actual memory usage
            };
        }
        catch (error) {
            logger_1.logger.error('Cache performance test error:', error);
            return {
                avgResponseTime: 0,
                throughput: 0,
                errorRate: 100,
                memoryUsage: 0,
            };
        }
    }
}
exports.CacheService = CacheService;
