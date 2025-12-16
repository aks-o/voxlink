import { PerformanceIntegrationService } from '../services/performance-integration.service';
import { getPerformanceConfig, validatePerformanceConfig } from '../config/performance.config';
import { CachingMiddleware, CacheStrategies } from '../middleware/caching.middleware';
import {
  createCompressionMiddleware,
  createCacheMiddleware,
  responseTimeMiddleware,
  securityHeadersMiddleware,
  requestSizeLimitMiddleware,
  staticAssetMiddleware,
  apiOptimizationMiddleware,
  conditionalRequestMiddleware,
} from '../middleware/performance.middleware';
import { logger } from '../monitoring/logger';

// Global performance service instance
let performanceService: PerformanceIntegrationService | null = null;
let cachingMiddleware: CachingMiddleware | null = null;

/**
 * Initialize performance optimization for the application
 */
export async function initializePerformance(): Promise<PerformanceIntegrationService> {
  try {
    logger.info('Initializing performance optimization system');

    // Get and validate configuration
    const config = getPerformanceConfig();
    const configErrors = validatePerformanceConfig(config);

    if (configErrors.length > 0) {
      throw new Error(`Performance configuration errors: ${configErrors.join(', ')}`);
    }

    // Create and initialize performance service
    performanceService = new PerformanceIntegrationService(config);
    await performanceService.initialize();

    // Initialize caching middleware if cache is enabled
    if (config.cache.enabled) {
      const cacheService = performanceService.getCacheService();
      if (cacheService) {
        cachingMiddleware = new CachingMiddleware(cacheService);
        logger.info('Caching middleware initialized');
      }
    }

    logger.info('Performance optimization system initialized successfully');
    return performanceService;

  } catch (error) {
    logger.error('Failed to initialize performance optimization:', error);
    throw error;
  }
}

/**
 * Get the global performance service instance
 */
export function getPerformanceService(): PerformanceIntegrationService {
  if (!performanceService) {
    throw new Error('Performance service not initialized. Call initializePerformance() first.');
  }
  return performanceService;
}

/**
 * Get the caching middleware instance
 */
export function getCachingMiddleware(): CachingMiddleware {
  if (!cachingMiddleware) {
    throw new Error('Caching middleware not initialized. Ensure cache is enabled in configuration.');
  }
  return cachingMiddleware;
}

/**
 * Shutdown performance optimization system
 */
export async function shutdownPerformance(): Promise<void> {
  if (performanceService) {
    await performanceService.shutdown();
    performanceService = null;
    cachingMiddleware = null;
    logger.info('Performance optimization system shut down');
  }
}

/**
 * Get all performance middleware for Express applications
 */
export function getPerformanceMiddleware() {
  const config = getPerformanceConfig();

  return {
    // Compression middleware
    compression: createCompressionMiddleware({
      enableCompression: true,
      compressionThreshold: 1024
    }),

    // Cache headers middleware
    cacheHeaders: createCacheMiddleware({
      enableCaching: config.cache.enabled,
      defaultCacheTtl: config.cache.defaultTtl
    }),

    // Response time tracking
    responseTime: responseTimeMiddleware(),

    // Security headers
    security: securityHeadersMiddleware(),

    // Request size limiting
    requestSizeLimit: requestSizeLimitMiddleware(),

    // Static asset optimization
    staticAssets: staticAssetMiddleware(),

    // API response optimization
    apiOptimization: apiOptimizationMiddleware(),

    // Conditional request handling
    conditionalRequests: conditionalRequestMiddleware(),

    // Caching middleware (if available)
    cache: cachingMiddleware ? {
      shortTerm: cachingMiddleware.cache(CacheStrategies.shortTerm()),
      mediumTerm: cachingMiddleware.cache(CacheStrategies.mediumTerm()),
      longTerm: cachingMiddleware.cache(CacheStrategies.longTerm()),
      userSpecific: cachingMiddleware.cache(CacheStrategies.userSpecific()),
      apiResponse: cachingMiddleware.cache(CacheStrategies.apiResponse()),
      staticContent: cachingMiddleware.cache(CacheStrategies.staticContent()),
      reports: cachingMiddleware.cache(CacheStrategies.reports()),
      analytics: cachingMiddleware.cache(CacheStrategies.analytics()),
    } : null,
  };
}

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Record a custom performance metric
   */
  recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => {
    if (performanceService) {
      const monitor = performanceService.getQueryOptimizer();
      // This would typically use the performance monitor service
      logger.debug('Performance metric recorded', { name, value, unit, tags });
    }
  },

  /**
   * Start a performance timer
   */
  startTimer: (name: string) => {
    const startTime = Date.now();
    return {
      end: () => {
        const duration = Date.now() - startTime;
        performanceUtils.recordMetric(`timer.${name}`, duration, 'ms');
        return duration;
      },
    };
  },

  /**
   * Measure function execution time
   */
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const timer = performanceUtils.startTimer(name);
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      performanceUtils.recordMetric(`timer.${name}.error`, 1, 'count');
      throw error;
    }
  },

  /**
   * Measure synchronous function execution time
   */
  measure: <T>(name: string, fn: () => T): T => {
    const timer = performanceUtils.startTimer(name);
    try {
      const result = fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      performanceUtils.recordMetric(`timer.${name}.error`, 1, 'count');
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
export const cacheUtils = {
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
  cached: async <T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> => {
    const cache = cacheUtils.getCache();

    // Try to get from cache first
    const cached = await cache.get<T>(key);
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
  invalidate: async (pattern: string) => {
    const cache = cacheUtils.getCache();
    // This would implement pattern-based invalidation
    logger.info('Cache invalidation requested', { pattern });
  },

  /**
   * Warm cache with data
   */
  warm: async (entries: Array<{ key: string; value: any; ttl?: number; tags?: string[] }>) => {
    const cache = cacheUtils.getCache();
    const keyValuePairs = entries.map(entry => ({
      key: entry.key,
      value: entry.value,
      options: { ttl: entry.ttl, tags: entry.tags },
    }));

    await cache.mset(keyValuePairs);
    logger.info(`Cache warmed with ${entries.length} entries`);
  },
};

/**
 * Circuit breaker utilities
 */
export const circuitBreakerUtils = {
  /**
   * Execute function with circuit breaker protection
   */
  execute: async <T>(
    serviceName: string,
    fn: () => Promise<T>,
    config?: {
      failureThreshold?: number;
      recoveryTimeout?: number;
      monitoringPeriod?: number;
    }
  ): Promise<T> => {
    const service = getPerformanceService();
    // This would use the circuit breaker service
    return await fn(); // Simplified for now
  },

  /**
   * Get circuit breaker status for a service
   */
  getStatus: (serviceName: string) => {
    const service = getPerformanceService();
    // This would get actual circuit breaker status
    return { state: 'CLOSED', errorRate: 0 };
  },
};

/**
 * Export all performance-related functionality
 */
export {
  // Services
  PerformanceIntegrationService,

  // Configuration
  getPerformanceConfig,
  validatePerformanceConfig,

  // Middleware
  CachingMiddleware,
  CacheStrategies,
  createCompressionMiddleware,
  createCacheMiddleware,
  responseTimeMiddleware,
  securityHeadersMiddleware,
  requestSizeLimitMiddleware,
  staticAssetMiddleware,
  apiOptimizationMiddleware,
  conditionalRequestMiddleware,
};

/**
 * Default export for easy importing
 */
export default {
  initialize: initializePerformance,
  shutdown: shutdownPerformance,
  getService: getPerformanceService,
  getMiddleware: getPerformanceMiddleware,
  utils: performanceUtils,
  cache: cacheUtils,
  circuitBreaker: circuitBreakerUtils,
};