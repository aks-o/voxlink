import { PerformanceIntegrationService } from '../services/performance-integration.service';
import { getPerformanceConfig, validatePerformanceConfig } from '../config/performance.config';
import { CachingMiddleware, CacheStrategies } from '../middleware/caching.middleware';
import { createCompressionMiddleware, createCacheMiddleware, responseTimeMiddleware, securityHeadersMiddleware, requestSizeLimitMiddleware, staticAssetMiddleware, apiOptimizationMiddleware, conditionalRequestMiddleware } from '../middleware/performance.middleware';
/**
 * Initialize performance optimization for the application
 */
export declare function initializePerformance(): Promise<PerformanceIntegrationService>;
/**
 * Get the global performance service instance
 */
export declare function getPerformanceService(): PerformanceIntegrationService;
/**
 * Get the caching middleware instance
 */
export declare function getCachingMiddleware(): CachingMiddleware;
/**
 * Shutdown performance optimization system
 */
export declare function shutdownPerformance(): Promise<void>;
/**
 * Get all performance middleware for Express applications
 */
export declare function getPerformanceMiddleware(): {
    compression: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    cacheHeaders: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    responseTime: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    security: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    requestSizeLimit: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => import("express").Response<any, Record<string, any>> | undefined;
    staticAssets: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    apiOptimization: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    conditionalRequests: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
    cache: {
        shortTerm: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
        mediumTerm: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
        longTerm: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
        userSpecific: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
        apiResponse: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
        staticContent: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
        reports: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
        analytics: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void | import("express").Response<any, Record<string, any>>>;
    } | null;
};
/**
 * Performance monitoring utilities
 */
export declare const performanceUtils: {
    /**
     * Record a custom performance metric
     */
    recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => void;
    /**
     * Start a performance timer
     */
    startTimer: (name: string) => {
        end: () => number;
    };
    /**
     * Measure function execution time
     */
    measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
    /**
     * Measure synchronous function execution time
     */
    measure: <T>(name: string, fn: () => T) => T;
    /**
     * Get current performance status
     */
    getStatus: () => Promise<{
        status: string;
        score?: undefined;
        services?: undefined;
        recommendations?: undefined;
    } | {
        status: string;
        score: number;
        services: number;
        recommendations: number;
    }>;
};
/**
 * Cache utilities for easy caching operations
 */
export declare const cacheUtils: {
    /**
     * Get cache service instance
     */
    getCache: () => import("..").CacheService;
    /**
     * Cache a function result
     */
    cached: <T>(key: string, fn: () => Promise<T>, ttl?: number, tags?: string[]) => Promise<T>;
    /**
     * Invalidate cache by pattern
     */
    invalidate: (pattern: string) => Promise<void>;
    /**
     * Warm cache with data
     */
    warm: (entries: Array<{
        key: string;
        value: any;
        ttl?: number;
        tags?: string[];
    }>) => Promise<void>;
};
/**
 * Circuit breaker utilities
 */
export declare const circuitBreakerUtils: {
    /**
     * Execute function with circuit breaker protection
     */
    execute: <T>(serviceName: string, fn: () => Promise<T>, config?: {
        failureThreshold?: number;
        recoveryTimeout?: number;
        monitoringPeriod?: number;
    }) => Promise<T>;
    /**
     * Get circuit breaker status for a service
     */
    getStatus: (serviceName: string) => {
        state: string;
        errorRate: number;
    };
};
/**
 * Export all performance-related functionality
 */
export { PerformanceIntegrationService, getPerformanceConfig, validatePerformanceConfig, CachingMiddleware, CacheStrategies, createCompressionMiddleware, createCacheMiddleware, responseTimeMiddleware, securityHeadersMiddleware, requestSizeLimitMiddleware, staticAssetMiddleware, apiOptimizationMiddleware, conditionalRequestMiddleware, };
/**
 * Default export for easy importing
 */
declare const _default: {
    initialize: typeof initializePerformance;
    shutdown: typeof shutdownPerformance;
    getService: typeof getPerformanceService;
    getMiddleware: typeof getPerformanceMiddleware;
    utils: {
        /**
         * Record a custom performance metric
         */
        recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => void;
        /**
         * Start a performance timer
         */
        startTimer: (name: string) => {
            end: () => number;
        };
        /**
         * Measure function execution time
         */
        measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
        /**
         * Measure synchronous function execution time
         */
        measure: <T>(name: string, fn: () => T) => T;
        /**
         * Get current performance status
         */
        getStatus: () => Promise<{
            status: string;
            score?: undefined;
            services?: undefined;
            recommendations?: undefined;
        } | {
            status: string;
            score: number;
            services: number;
            recommendations: number;
        }>;
    };
    cache: {
        /**
         * Get cache service instance
         */
        getCache: () => import("..").CacheService;
        /**
         * Cache a function result
         */
        cached: <T>(key: string, fn: () => Promise<T>, ttl?: number, tags?: string[]) => Promise<T>;
        /**
         * Invalidate cache by pattern
         */
        invalidate: (pattern: string) => Promise<void>;
        /**
         * Warm cache with data
         */
        warm: (entries: Array<{
            key: string;
            value: any;
            ttl?: number;
            tags?: string[];
        }>) => Promise<void>;
    };
    circuitBreaker: {
        /**
         * Execute function with circuit breaker protection
         */
        execute: <T>(serviceName: string, fn: () => Promise<T>, config?: {
            failureThreshold?: number;
            recoveryTimeout?: number;
            monitoringPeriod?: number;
        }) => Promise<T>;
        /**
         * Get circuit breaker status for a service
         */
        getStatus: (serviceName: string) => {
            state: string;
            errorRate: number;
        };
    };
};
export default _default;
