"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmer = exports.CacheStrategies = exports.CachingMiddleware = void 0;
const logger_1 = require("../monitoring/logger");
const crypto_1 = __importDefault(require("crypto"));
class CachingMiddleware {
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    /**
     * Create caching middleware for API responses
     */
    cache(options = {}) {
        return async (req, res, next) => {
            // Skip caching for non-GET requests by default
            if (req.method !== 'GET') {
                return next();
            }
            // Check skip condition
            if (options.skipCache && options.skipCache(req)) {
                return next();
            }
            // Check cache condition
            if (options.condition && !options.condition(req, res)) {
                return next();
            }
            try {
                const cacheKey = this.generateCacheKey(req, options);
                // Try to get from cache
                const cachedResponse = await this.cacheService.get(cacheKey);
                if (cachedResponse) {
                    // Cache hit
                    if (options.onHit) {
                        options.onHit(cacheKey, req);
                    }
                    // Set cached headers
                    Object.entries(cachedResponse.headers).forEach(([key, value]) => {
                        res.setHeader(key, value);
                    });
                    // Add cache headers
                    res.setHeader('X-Cache', 'HIT');
                    res.setHeader('X-Cache-Key', cacheKey);
                    res.setHeader('X-Cache-Timestamp', new Date(cachedResponse.timestamp).toISOString());
                    return res.status(cachedResponse.statusCode).json(cachedResponse.body);
                }
                // Cache miss - intercept response
                if (options.onMiss) {
                    options.onMiss(cacheKey, req);
                }
                const originalSend = res.json;
                const originalStatus = res.status;
                let statusCode = 200;
                let responseBody;
                // Override status method
                res.status = function (code) {
                    statusCode = code;
                    return originalStatus.call(this, code);
                };
                // Override json method
                res.json = function (body) {
                    responseBody = body;
                    // Only cache successful responses
                    if (statusCode >= 200 && statusCode < 300) {
                        const responseToCache = {
                            statusCode,
                            headers: this.getHeaders(),
                            body,
                            timestamp: Date.now(),
                        };
                        const tags = typeof options.tags === 'function'
                            ? options.tags(req)
                            : options.tags;
                        // Cache the response asynchronously
                        setImmediate(() => {
                            this.cacheService.set(cacheKey, responseToCache, {
                                ttl: options.ttl,
                                tags,
                                compress: options.compress,
                            }).catch(error => {
                                if (options.onError) {
                                    options.onError(error, req);
                                }
                                else {
                                    logger_1.logger.error('Cache set error:', error);
                                }
                            });
                        });
                    }
                    // Add cache headers
                    this.setHeader('X-Cache', 'MISS');
                    this.setHeader('X-Cache-Key', cacheKey);
                    return originalSend.call(this, body);
                }.bind(res);
                next();
            }
            catch (error) {
                if (options.onError) {
                    options.onError(error, req);
                }
                else {
                    logger_1.logger.error('Cache middleware error:', error);
                }
                next();
            }
        };
    }
    /**
     * Middleware to invalidate cache by tags
     */
    invalidate(tags) {
        return async (req, res, next) => {
            const originalSend = res.json;
            res.json = function (body) {
                const tagsToInvalidate = typeof tags === 'function' ? tags(req) : tags;
                // Invalidate cache asynchronously after response
                setImmediate(async () => {
                    try {
                        for (const tag of tagsToInvalidate) {
                            await this.cacheService.invalidateByTag(tag);
                        }
                        logger_1.logger.debug(`Cache invalidated for tags: ${tagsToInvalidate.join(', ')}`);
                    }
                    catch (error) {
                        logger_1.logger.error('Cache invalidation error:', error);
                    }
                });
                return originalSend.call(this, body);
            }.bind(this);
            next();
        };
    }
    /**
     * Generate cache key for request
     */
    generateCacheKey(req, options) {
        if (options.keyGenerator) {
            return options.keyGenerator(req);
        }
        // Default key generation
        const baseKey = `${req.method}:${req.originalUrl || req.url}`;
        // Add vary-by parameters
        const varyParts = [];
        if (options.varyBy) {
            for (const varyParam of options.varyBy) {
                if (varyParam.startsWith('header:')) {
                    const headerName = varyParam.substring(7);
                    const headerValue = req.get(headerName);
                    if (headerValue) {
                        varyParts.push(`${headerName}:${headerValue}`);
                    }
                }
                else if (varyParam.startsWith('query:')) {
                    const queryParam = varyParam.substring(6);
                    const queryValue = req.query[queryParam];
                    if (queryValue) {
                        varyParts.push(`${queryParam}:${queryValue}`);
                    }
                }
                else if (varyParam === 'user') {
                    // Vary by user ID if available
                    const userId = req.user?.id;
                    if (userId) {
                        varyParts.push(`user:${userId}`);
                    }
                }
            }
        }
        const fullKey = varyParts.length > 0
            ? `${baseKey}:${varyParts.join(':')}`
            : baseKey;
        // Hash long keys to keep them manageable
        if (fullKey.length > 200) {
            return `hashed:${crypto_1.default.createHash('sha256').update(fullKey).digest('hex')}`;
        }
        return fullKey;
    }
}
exports.CachingMiddleware = CachingMiddleware;
/**
 * Predefined caching strategies
 */
exports.CacheStrategies = {
    /**
     * Short-term cache for frequently changing data
     */
    shortTerm: (ttl = 300) => ({
        ttl, // 5 minutes default
        tags: ['short-term'],
        compress: false,
    }),
    /**
     * Medium-term cache for moderately changing data
     */
    mediumTerm: (ttl = 1800) => ({
        ttl, // 30 minutes default
        tags: ['medium-term'],
        compress: true,
    }),
    /**
     * Long-term cache for rarely changing data
     */
    longTerm: (ttl = 3600) => ({
        ttl, // 1 hour default
        tags: ['long-term'],
        compress: true,
    }),
    /**
     * User-specific cache
     */
    userSpecific: (ttl = 900) => ({
        ttl, // 15 minutes default
        varyBy: ['user'],
        tags: (req) => {
            const userId = req.user?.id;
            return userId ? [`user:${userId}`, 'user-specific'] : ['user-specific'];
        },
    }),
    /**
     * API response cache with compression
     */
    apiResponse: (ttl = 600) => ({
        ttl, // 10 minutes default
        compress: true,
        condition: (req, res) => req.method === 'GET',
        tags: ['api-response'],
        varyBy: ['header:accept', 'query:page', 'query:limit'],
    }),
    /**
     * Static content cache
     */
    staticContent: (ttl = 86400) => ({
        ttl, // 24 hours default
        compress: true,
        tags: ['static-content'],
        condition: (req, res) => {
            const contentType = res.getHeader('content-type');
            return contentType && (contentType.includes('image/') ||
                contentType.includes('text/css') ||
                contentType.includes('application/javascript'));
        },
    }),
    /**
     * Report cache with longer TTL
     */
    reports: (ttl = 7200) => ({
        ttl, // 2 hours default
        compress: true,
        tags: ['reports'],
        varyBy: ['user', 'query:startDate', 'query:endDate', 'query:filters'],
        keyGenerator: (req) => {
            const userId = req.user?.id || 'anonymous';
            const params = new URLSearchParams(req.query).toString();
            return `report:${req.path}:${userId}:${params}`;
        },
    }),
    /**
     * Analytics cache
     */
    analytics: (ttl = 1800) => ({
        ttl, // 30 minutes default
        compress: true,
        tags: ['analytics'],
        varyBy: ['user', 'query:period', 'query:metric'],
    }),
};
/**
 * Cache warming utilities
 */
class CacheWarmer {
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    /**
     * Warm cache with predefined data
     */
    async warmCache(entries) {
        const keyValuePairs = entries.map(entry => ({
            key: entry.key,
            value: entry.value,
            options: {
                ttl: entry.ttl,
                tags: entry.tags,
            },
        }));
        await this.cacheService.mset(keyValuePairs);
        logger_1.logger.info(`Cache warmed with ${entries.length} entries`);
    }
    /**
     * Warm cache by making requests to endpoints
     */
    async warmEndpoints(endpoints) {
        // This would make actual HTTP requests to warm the cache
        // Implementation would depend on your HTTP client
        logger_1.logger.info(`Warming cache for ${endpoints.length} endpoints`);
    }
}
exports.CacheWarmer = CacheWarmer;
