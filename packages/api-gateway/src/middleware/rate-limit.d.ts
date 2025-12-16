import { Response, NextFunction } from 'express';
import { config } from '../config/config';
import { RedisService } from '../services/redis.service';
import { AuthenticatedRequest } from './auth';
export declare class RedisRateLimiter {
    private redisService;
    constructor(redisService: RedisService);
    isRateLimited(key: string, windowMs: number, maxRequests: number): Promise<{
        limited: boolean;
        remaining: number;
        resetTime: number;
    }>;
}
export declare function rateLimitMiddleware(service: keyof typeof config.rateLimit): import("express-rate-limit").RateLimitRequestHandler;
export declare function tieredRateLimitMiddleware(service: keyof typeof config.rateLimit, redisService: RedisService): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function burstProtectionMiddleware(service: keyof typeof config.rateLimit, redisService: RedisService, burstLimit?: number, burstWindowMs?: number): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
