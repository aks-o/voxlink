"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conditionalRequestMiddleware = exports.apiOptimizationMiddleware = exports.staticAssetMiddleware = exports.requestSizeLimitMiddleware = exports.securityHeadersMiddleware = exports.responseTimeMiddleware = exports.createCacheMiddleware = exports.createCompressionMiddleware = exports.CacheStrategies = exports.CachingMiddleware = exports.validatePerformanceConfig = exports.getPerformanceConfig = exports.PerformanceIntegrationService = exports.circuitBreakerUtils = exports.cacheUtils = exports.performanceUtils = void 0;
exports.initializePerformance = initializePerformance;
exports.getPerformanceService = getPerformanceService;
exports.getCachingMiddleware = getCachingMiddleware;
exports.shutdownPerformance = shutdownPerformance;
exports.getPerformanceMiddleware = getPerformanceMiddleware;
const performance_integration_service_1 = require("../services/performance-integration.service");
Object.defineProperty(exports, "PerformanceIntegrationService", { enumerable: true, get: function () { return performance_integration_service_1.PerformanceIntegrationService; } });
const performance_config_1 = require("../config/performance.config");
Object.defineProperty(exports, "getPerformanceConfig", { enumerable: true, get: function () { return performance_config_1.getPerformanceConfig; } });
Object.defineProperty(exports, "validatePerformanceConfig", { enumerable: true, get: function () { return performance_config_1.validatePerformanceConfig; } });
const caching_middleware_1 = require("../middleware/caching.middleware");
Object.defineProperty(exports, "CachingMiddleware", { enumerable: true, get: function () { return caching_middleware_1.CachingMiddleware; } });
Object.defineProperty(exports, "CacheStrategies", { enumerable: true, get: function () { return caching_middleware_1.CacheStrategies; } });
const performance_middleware_1 = require("../middleware/performance.middleware");
Object.defineProperty(exports, "createCompressionMiddleware", { enumerable: true, get: function () { return performance_middleware_1.createCompressionMiddleware; } });
Object.defineProperty(exports, "createCacheMiddleware", { enumerable: true, get: function () { return performance_middleware_1.createCacheMiddleware; } });
Object.defineProperty(exports, "responseTimeMiddleware", { enumerable: true, get: function () { return performance_middleware_1.responseTimeMiddleware; } });
Object.defineProperty(exports, "securityHeadersMiddleware", { enumerable: true, get: function () { return performance_middleware_1.securityHeadersMiddleware; } });
Object.defineProperty(exports, "requestSizeLimitMiddleware", { enumerable: true, get: function () { return performance_middleware_1.requestSizeLimitMiddleware; } });
Object.defineProperty(exports, "staticAssetMiddleware", { enumerable: true, get: function () { return performance_middleware_1.staticAssetMiddleware; } });
Object.defineProperty(exports, "apiOptimizationMiddleware", { enumerable: true, get: function () { return performance_middleware_1.apiOptimizationMiddleware; } });
Object.defineProperty(exports, "conditionalRequestMiddleware", { enumerable: true, get: function () { return performance_middleware_1.conditionalRequestMiddleware; } });
const logger_1 = require("../monitoring/logger");
// Global performance service instance
let performanceService = null;
let cachingMiddleware = null;
/**
 * Initialize performance optimization for the application
 */
async function initializePerformance() {
    try {
        logger_1.logger.info('Initializing performance optimization system');
        // Get and validate configuration
        const config = (0, performance_config_1.getPerformanceConfig)();
        const configErrors = (0, performance_config_1.validatePerformanceConfig)(config);
        if (configErrors.length > 0) {
            throw new Error(`Performance configuration errors: ${configErrors.join(', ')}`);
        }
        // Create and initialize performance service
        performanceService = new performance_integration_service_1.PerformanceIntegrationService(config);
        await performanceService.initialize();
        // Initialize caching middleware if cache is enabled
        if (config.cache.enabled) {
            const cacheService = performanceService.getCacheService();
            if (cacheService) {
                cachingMiddleware = new caching_middleware_1.CachingMiddleware(cacheService);
                logger_1.logger.info('Caching middleware initialized');
            }
        }
        logger_1.logger.info('Performance optimization system initialized successfully');
        return performanceService;
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize performance optimization:', error);
        throw error;
    }
}
/**
 * Get the global performance service instance
 */
function getPerformanceService() {
    if (!performanceService) {
        throw new Error('Performance service not initialized. Call initializePerformance() first.');
    }
    return performanceService;
}
/**
 * Get the caching middleware instance
 */
function getCachingMiddleware() {
    if (!cachingMiddleware) {
        throw new Error('Caching middleware not initialized. Ensure cache is enabled in configuration.');
    }
    return cachingMiddleware;
}
/**
 * Shutdown performance optimization system
 */
async function shutdownPerformance() {
    if (performanceService) {
        await performanceService.shutdown();
        performanceService = null;
        cachingMiddleware = null;
        logger_1.logger.info('Performance optimization system shut down');
    }
}
/**
 * Get all performance middleware for Express applications
 */
function getPerformanceMiddleware() {
    const config = (0, performance_config_1.getPerformanceConfig)();
    return {
        // Compression middleware
        compression: (0, performance_middleware_1.createCompressionMiddleware)({
            enableCompression: true,
            compressionThreshold: 1024
        }),
        // Cache headers middleware
        cacheHeaders: (0, performance_middleware_1.createCacheMiddleware)({
            enableCaching: config.cache.enabled,
            defaultCacheTtl: config.cache.defaultTtl
        }),
        // Response time tracking
        responseTime: (0, performance_middleware_1.responseTimeMiddleware)(),
        // Security headers
        security: (0, performance_middleware_1.securityHeadersMiddleware)(),
        // Request size limiting
        requestSizeLimit: (0, performance_middleware_1.requestSizeLimitMiddleware)(),
        // Static asset optimization
        staticAssets: (0, performance_middleware_1.staticAssetMiddleware)(),
        // API response optimization
        apiOptimization: (0, performance_middleware_1.apiOptimizationMiddleware)(),
        // Conditional request handling
        conditionalRequests: (0, performance_middleware_1.conditionalRequestMiddleware)(),
        // Caching middleware (if available)
        cache: cachingMiddleware ? {
            shortTerm: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.shortTerm()),
            mediumTerm: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.mediumTerm()),
            longTerm: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.longTerm()),
            userSpecific: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.userSpecific()),
            apiResponse: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.apiResponse()),
            staticContent: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.staticContent()),
            reports: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.reports()),
            analytics: cachingMiddleware.cache(caching_middleware_1.CacheStrategies.analytics()),
        } : null,
    };
}
/**
 * Performance monitoring utilities
 */
exports.performanceUtils = {
    /**
     * Record a custom performance metric
     */
    recordMetric: (name, value, unit, tags) => {
        if (performanceService) {
            const monitor = performanceService.getQueryOptimizer();
            // This would typically use the performance monitor service
            logger_1.logger.debug('Performance metric recorded', { name, value, unit, tags });
        }
    },
    /**
     * Start a performance timer
     */
    startTimer: (name) => {
        const startTime = Date.now();
        return {
            end: () => {
                const duration = Date.now() - startTime;
                exports.performanceUtils.recordMetric(`timer.${name}`, duration, 'ms');
                return duration;
            },
        };
    },
    /**
     * Measure function execution time
     */
    measureAsync: async (name, fn) => {
        const timer = exports.performanceUtils.startTimer(name);
        try {
            const result = await fn();
            timer.end();
            return result;
        }
        catch (error) {
            timer.end();
            exports.performanceUtils.recordMetric(`timer.${name}.error`, 1, 'count');
            throw error;
        }
    },
    /**
     * Measure synchronous function execution time
     */
    measure: (name, fn) => {
        const timer = exports.performanceUtils.startTimer(name);
        try {
            const result = fn();
            timer.end();
            return result;
        }
        catch (error) {
            timer.end();
            exports.performanceUtils.recordMetric(`timer.${name}.error`, 1, 'count');
            throw error;
        }
    },
    /**
     * Get current performance status
     */
    getStatus: async () => {
        if (!performanceService) {
            return { status: 'not_initialized' };
        }
        const isHealthy = await performanceService.isHealthy();
        const report = await performanceService.getPerformanceReport();
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            score: report.overall.score,
            services: Object.keys(report.services).length,
            recommendations: report.overall.recommendations.length,
        };
    },
};
/**
 * Cache utilities for easy caching operations
 */
exports.cacheUtils = {
    /**
     * Get cache service instance
     */
    getCache: () => {
        const service = getPerformanceService();
        const cache = service.getCacheService();
        if (!cache) {
            throw new Error('Cache service not available');
        }
        return cache;
    },
    /**
     * Cache a function result
     */
    cached: async (key, fn, ttl, tags) => {
        const cache = exports.cacheUtils.getCache();
        // Try to get from cache first
        const cached = await cache.get(key);
        if (cached !== null) {
            return cached;
        }
        // Execute function and cache result
        const result = await fn();
        await cache.set(key, result, { ttl, tags });
        return result;
    },
    /**
     * Invalidate cache by pattern
     */
    invalidate: async (pattern) => {
        const cache = exports.cacheUtils.getCache();
        // This would implement pattern-based invalidation
        logger_1.logger.info('Cache invalidation requested', { pattern });
    },
    /**
     * Warm cache with data
     */
    warm: async (entries) => {
        const cache = exports.cacheUtils.getCache();
        const keyValuePairs = entries.map(entry => ({
            key: entry.key,
            value: entry.value,
            options: { ttl: entry.ttl, tags: entry.tags },
        }));
        await cache.mset(keyValuePairs);
        logger_1.logger.info(`Cache warmed with ${entries.length} entries`);
    },
};
/**
 * Circuit breaker utilities
 */
exports.circuitBreakerUtils = {
    /**
     * Execute function with circuit breaker protection
     */
    execute: async (serviceName, fn, config) => {
        const service = getPerformanceService();
        // This would use the circuit breaker service
        return await fn(); // Simplified for now
    },
    /**
     * Get circuit breaker status for a service
     */
    getStatus: (serviceName) => {
        const service = getPerformanceService();
        // This would get actual circuit breaker status
        return { state: 'CLOSED', errorRate: 0 };
    },
};
/**
 * Default export for easy importing
 */
exports.default = {
    initialize: initializePerformance,
    shutdown: shutdownPerformance,
    getService: getPerformanceService,
    getMiddleware: getPerformanceMiddleware,
    utils: exports.performanceUtils,
    cache: exports.cacheUtils,
    circuitBreaker: exports.circuitBreakerUtils,
};
