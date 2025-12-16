import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service';
import { logger } from '../monitoring/logger';
import crypto from 'crypto';

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

export class CachingMiddleware {
  constructor(private cacheService: CacheService) { }

  /**
   * Create caching middleware for API responses
   */
  cache(options: CacheMiddlewareOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
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
        const cachedResponse = await this.cacheService.get<{
          statusCode: number;
          headers: Record<string, string>;
          body: any;
          timestamp: number;
        }>(cacheKey);

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
        let responseBody: any;

        // Override status method
        res.status = function (code: number) {
          statusCode = code;
          return originalStatus.call(this, code);
        };

        // Override json method
        res.json = function (body: any) {
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
                } else {
                  logger.error('Cache set error:', error);
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

      } catch (error: any) {
        if (options.onError) {
          options.onError(error, req);
        } else {
          logger.error('Cache middleware error:', error);
        }
        next();
      }
    };
  }

  /**
   * Middleware to invalidate cache by tags
   */
  invalidate(tags: string[] | ((req: Request) => string[])) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.json;

      res.json = function (body: any) {
        const tagsToInvalidate = typeof tags === 'function' ? tags(req) : tags;

        // Invalidate cache asynchronously after response
        setImmediate(async () => {
          try {
            for (const tag of tagsToInvalidate) {
              await this.cacheService.invalidateByTag(tag);
            }
            logger.debug(`Cache invalidated for tags: ${tagsToInvalidate.join(', ')}`);
          } catch (error) {
            logger.error('Cache invalidation error:', error);
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
  private generateCacheKey(req: Request, options: CacheMiddlewareOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(req);
    }

    // Default key generation
    const baseKey = `${req.method}:${req.originalUrl || req.url}`;

    // Add vary-by parameters
    const varyParts: string[] = [];

    if (options.varyBy) {
      for (const varyParam of options.varyBy) {
        if (varyParam.startsWith('header:')) {
          const headerName = varyParam.substring(7);
          const headerValue = req.get(headerName);
          if (headerValue) {
            varyParts.push(`${headerName}:${headerValue}`);
          }
        } else if (varyParam.startsWith('query:')) {
          const queryParam = varyParam.substring(6);
          const queryValue = req.query[queryParam];
          if (queryValue) {
            varyParts.push(`${queryParam}:${queryValue}`);
          }
        } else if (varyParam === 'user') {
          // Vary by user ID if available
          const userId = (req as any).user?.id;
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
      return `hashed:${crypto.createHash('sha256').update(fullKey).digest('hex')}`;
    }

    return fullKey;
  }
}

/**
 * Predefined caching strategies
 */
export const CacheStrategies = {
  /**
   * Short-term cache for frequently changing data
   */
  shortTerm: (ttl: number = 300): CacheMiddlewareOptions => ({
    ttl, // 5 minutes default
    tags: ['short-term'],
    compress: false,
  }),

  /**
   * Medium-term cache for moderately changing data
   */
  mediumTerm: (ttl: number = 1800): CacheMiddlewareOptions => ({
    ttl, // 30 minutes default
    tags: ['medium-term'],
    compress: true,
  }),

  /**
   * Long-term cache for rarely changing data
   */
  longTerm: (ttl: number = 3600): CacheMiddlewareOptions => ({
    ttl, // 1 hour default
    tags: ['long-term'],
    compress: true,
  }),

  /**
   * User-specific cache
   */
  userSpecific: (ttl: number = 900): CacheMiddlewareOptions => ({
    ttl, // 15 minutes default
    varyBy: ['user'],
    tags: (req: Request) => {
      const userId = (req as any).user?.id;
      return userId ? [`user:${userId}`, 'user-specific'] : ['user-specific'];
    },
  }),

  /**
   * API response cache with compression
   */
  apiResponse: (ttl: number = 600): CacheMiddlewareOptions => ({
    ttl, // 10 minutes default
    compress: true,
    condition: (req, res) => req.method === 'GET',
    tags: ['api-response'],
    varyBy: ['header:accept', 'query:page', 'query:limit'],
  }),

  /**
   * Static content cache
   */
  staticContent: (ttl: number = 86400): CacheMiddlewareOptions => ({
    ttl, // 24 hours default
    compress: true,
    tags: ['static-content'],
    condition: (req, res) => {
      const contentType = res.getHeader('content-type') as string;
      return contentType && (
        contentType.includes('image/') ||
        contentType.includes('text/css') ||
        contentType.includes('application/javascript')
      );
    },
  }),

  /**
   * Report cache with longer TTL
   */
  reports: (ttl: number = 7200): CacheMiddlewareOptions => ({
    ttl, // 2 hours default
    compress: true,
    tags: ['reports'],
    varyBy: ['user', 'query:startDate', 'query:endDate', 'query:filters'],
    keyGenerator: (req) => {
      const userId = (req as any).user?.id || 'anonymous';
      const params = new URLSearchParams(req.query as any).toString();
      return `report:${req.path}:${userId}:${params}`;
    },
  }),

  /**
   * Analytics cache
   */
  analytics: (ttl: number = 1800): CacheMiddlewareOptions => ({
    ttl, // 30 minutes default
    compress: true,
    tags: ['analytics'],
    varyBy: ['user', 'query:period', 'query:metric'],
  }),
};

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  constructor(private cacheService: CacheService) { }

  /**
   * Warm cache with predefined data
   */
  async warmCache(entries: Array<{
    key: string;
    value: any;
    ttl?: number;
    tags?: string[];
  }>): Promise<void> {
    const keyValuePairs = entries.map(entry => ({
      key: entry.key,
      value: entry.value,
      options: {
        ttl: entry.ttl,
        tags: entry.tags,
      },
    }));

    await this.cacheService.mset(keyValuePairs);
    logger.info(`Cache warmed with ${entries.length} entries`);
  }

  /**
   * Warm cache by making requests to endpoints
   */
  async warmEndpoints(endpoints: Array<{
    url: string;
    method?: string;
    headers?: Record<string, string>;
  }>): Promise<void> {
    // This would make actual HTTP requests to warm the cache
    // Implementation would depend on your HTTP client
    logger.info(`Warming cache for ${endpoints.length} endpoints`);
  }
}