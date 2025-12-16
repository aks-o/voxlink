import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service';
export interface CacheMiddlewareOptions {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request, res: Response) => boolean;
    tags?: string[] | ((req: Request) => string[]);
    compress?: boolean;
    varyBy?: string[];
    skipCache?: (req: Request) => boolean;
    onHit?: (key: string, req: Request) => void;
    onMiss?: (key: string, req: Request) => void;
    onError?: (error: Error, req: Request) => void;
}
export declare class CachingMiddleware {
    private cacheService;
    constructor(cacheService: CacheService);
    /**
     * Create caching middleware for API responses
     */
    cache(options?: CacheMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Middleware to invalidate cache by tags
     */
    invalidate(tags: string[] | ((req: Request) => string[])): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Generate cache key for request
     */
    private generateCacheKey;
}
/**
 * Predefined caching strategies
 */
export declare const CacheStrategies: {
    /**
     * Short-term cache for frequently changing data
     */
    shortTerm: (ttl?: number) => CacheMiddlewareOptions;
    /**
     * Medium-term cache for moderately changing data
     */
    mediumTerm: (ttl?: number) => CacheMiddlewareOptions;
    /**
     * Long-term cache for rarely changing data
     */
    longTerm: (ttl?: number) => CacheMiddlewareOptions;
    /**
     * User-specific cache
     */
    userSpecific: (ttl?: number) => CacheMiddlewareOptions;
    /**
     * API response cache with compression
     */
    apiResponse: (ttl?: number) => CacheMiddlewareOptions;
    /**
     * Static content cache
     */
    staticContent: (ttl?: number) => CacheMiddlewareOptions;
    /**
     * Report cache with longer TTL
     */
    reports: (ttl?: number) => CacheMiddlewareOptions;
    /**
     * Analytics cache
     */
    analytics: (ttl?: number) => CacheMiddlewareOptions;
};
/**
 * Cache warming utilities
 */
export declare class CacheWarmer {
    private cacheService;
    constructor(cacheService: CacheService);
    /**
     * Warm cache with predefined data
     */
    warmCache(entries: Array<{
        key: string;
        value: any;
        ttl?: number;
        tags?: string[];
    }>): Promise<void>;
    /**
     * Warm cache by making requests to endpoints
     */
    warmEndpoints(endpoints: Array<{
        url: string;
        method?: string;
        headers?: Record<string, string>;
    }>): Promise<void>;
}
