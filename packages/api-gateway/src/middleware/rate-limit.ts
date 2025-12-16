import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/config';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './auth';

// Redis-based rate limiter
export class RedisRateLimiter {
  constructor(private redisService: RedisService) { }

  async isRateLimited(
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    try {
      const current = await this.redisService.incrementRateLimit(key, windowMs);
      const limited = current > maxRequests;
      const remaining = Math.max(0, maxRequests - current);
      const resetTime = Date.now() + windowMs;

      return { limited, remaining, resetTime };
    } catch (error) {
      logger.error('Rate limit check failed:', error as any);
      // Fail open - don't block requests if Redis is down
      return { limited: false, remaining: maxRequests, resetTime: Date.now() + windowMs };
    }
  }
}

export function rateLimitMiddleware(service: keyof typeof config.rateLimit) {
  const rateLimitConfig = config.rateLimit[service];

  return rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.max,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests to ${service} service. Please try again later.`,
        retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthenticatedRequest) => {
      // Use user ID if authenticated, otherwise fall back to IP
      if (req.user) {
        return `user:${req.user.id}:${service}`;
      } else if (req.apiKey) {
        return `apikey:${req.apiKey.id}:${service}`;
      } else {
        return `ip:${req.ip}:${service}`;
      }
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${service}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests to ${service} service. Please try again later.`,
          retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
        },
      });
    },
  });
}

// Advanced rate limiting with different tiers based on user type
export function tieredRateLimitMiddleware(
  service: keyof typeof config.rateLimit,
  redisService: RedisService
) {
  const baseLimits = config.rateLimit[service];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let windowMs = baseLimits.windowMs;
      let maxRequests = baseLimits.max;
      let keyPrefix = 'ip';
      let identifier = req.ip;

      // Adjust limits based on authentication type and user role
      if (req.user) {
        keyPrefix = 'user';
        identifier = req.user.id;

        // Admin users get higher limits
        if (req.user.role === 'admin') {
          maxRequests = Math.floor(maxRequests * 2);
        }
        // Premium users could get higher limits
        // if (req.user.plan === 'premium') {
        //   maxRequests = Math.floor(maxRequests * 1.5);
        // }
      } else if (req.apiKey) {
        keyPrefix = 'apikey';
        identifier = req.apiKey.id;

        // API keys typically get higher limits
        maxRequests = Math.floor(maxRequests * 1.5);
      }

      const rateLimitKey = `${keyPrefix}:${identifier}:${service}`;
      const rateLimiter = new RedisRateLimiter(redisService);

      const result = await rateLimiter.isRateLimited(rateLimitKey, windowMs, maxRequests);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (result.limited) {
        logger.warn(`Tiered rate limit exceeded for ${service}`, {
          keyPrefix,
          identifier,
          service,
          maxRequests,
          windowMs,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });

        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests to ${service} service. Please try again later.`,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            limit: maxRequests,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString(),
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Tiered rate limit middleware error:', error as any);
      // Fail open - continue processing if rate limiting fails
      next();
    }
  };
}

// Burst protection - allows short bursts but enforces longer-term limits
export function burstProtectionMiddleware(
  service: keyof typeof config.rateLimit,
  redisService: RedisService,
  burstLimit: number = 10,
  burstWindowMs: number = 1000
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let identifier = req.ip;
      let keyPrefix = 'ip';

      if (req.user) {
        keyPrefix = 'user';
        identifier = req.user.id;
      } else if (req.apiKey) {
        keyPrefix = 'apikey';
        identifier = req.apiKey.id;
      }

      const burstKey = `burst:${keyPrefix}:${identifier}:${service}`;
      const rateLimiter = new RedisRateLimiter(redisService);

      const burstResult = await rateLimiter.isRateLimited(burstKey, burstWindowMs, burstLimit);

      if (burstResult.limited) {
        logger.warn(`Burst limit exceeded for ${service}`, {
          keyPrefix,
          identifier,
          service,
          burstLimit,
          burstWindowMs,
          ip: req.ip,
          path: req.path,
          method: req.method,
        });

        return res.status(429).json({
          error: {
            code: 'BURST_LIMIT_EXCEEDED',
            message: 'Too many requests in a short time. Please slow down.',
            retryAfter: Math.ceil(burstWindowMs / 1000),
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Burst protection middleware error:', error as any);
      next();
    }
  };
}