"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisRateLimiter = void 0;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.tieredRateLimitMiddleware = tieredRateLimitMiddleware;
exports.burstProtectionMiddleware = burstProtectionMiddleware;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
// Redis-based rate limiter
class RedisRateLimiter {
    constructor(redisService) {
        this.redisService = redisService;
    }
    async isRateLimited(key, windowMs, maxRequests) {
        try {
            const current = await this.redisService.incrementRateLimit(key, windowMs);
            const limited = current > maxRequests;
            const remaining = Math.max(0, maxRequests - current);
            const resetTime = Date.now() + windowMs;
            return { limited, remaining, resetTime };
        }
        catch (error) {
            logger_1.logger.error('Rate limit check failed:', error);
            // Fail open - don't block requests if Redis is down
            return { limited: false, remaining: maxRequests, resetTime: Date.now() + windowMs };
        }
    }
}
exports.RedisRateLimiter = RedisRateLimiter;
function rateLimitMiddleware(service) {
    const rateLimitConfig = config_1.config.rateLimit[service];
    return (0, express_rate_limit_1.default)({
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
        keyGenerator: (req) => {
            // Use user ID if authenticated, otherwise fall back to IP
            if (req.user) {
                return `user:${req.user.id}:${service}`;
            }
            else if (req.apiKey) {
                return `apikey:${req.apiKey.id}:${service}`;
            }
            else {
                return `ip:${req.ip}:${service}`;
            }
        },
        handler: (req, res) => {
            logger_1.logger.warn(`Rate limit exceeded for ${service}`, {
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
function tieredRateLimitMiddleware(service, redisService) {
    const baseLimits = config_1.config.rateLimit[service];
    return async (req, res, next) => {
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
            }
            else if (req.apiKey) {
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
                logger_1.logger.warn(`Tiered rate limit exceeded for ${service}`, {
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
        }
        catch (error) {
            logger_1.logger.error('Tiered rate limit middleware error:', error);
            // Fail open - continue processing if rate limiting fails
            next();
        }
    };
}
// Burst protection - allows short bursts but enforces longer-term limits
function burstProtectionMiddleware(service, redisService, burstLimit = 10, burstWindowMs = 1000) {
    return async (req, res, next) => {
        try {
            let identifier = req.ip;
            let keyPrefix = 'ip';
            if (req.user) {
                keyPrefix = 'user';
                identifier = req.user.id;
            }
            else if (req.apiKey) {
                keyPrefix = 'apikey';
                identifier = req.apiKey.id;
            }
            const burstKey = `burst:${keyPrefix}:${identifier}:${service}`;
            const rateLimiter = new RedisRateLimiter(redisService);
            const burstResult = await rateLimiter.isRateLimited(burstKey, burstWindowMs, burstLimit);
            if (burstResult.limited) {
                logger_1.logger.warn(`Burst limit exceeded for ${service}`, {
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
        }
        catch (error) {
            logger_1.logger.error('Burst protection middleware error:', error);
            next();
        }
    };
}
