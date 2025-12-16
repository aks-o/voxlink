import { Request, Response, NextFunction } from 'express';
export interface PerformanceConfig {
    enableCompression?: boolean;
    compressionLevel?: number;
    compressionThreshold?: number;
    enableCaching?: boolean;
    defaultCacheTtl?: number;
    enableEtag?: boolean;
    enableLastModified?: boolean;
}
export interface CacheOptions {
    ttl?: number;
    private?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
    immutable?: boolean;
    staleWhileRevalidate?: number;
    staleIfError?: number;
}
/**
 * Compression middleware with smart content type detection
 */
export declare function createCompressionMiddleware(config?: PerformanceConfig): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Cache headers middleware
 */
export declare function createCacheMiddleware(config?: PerformanceConfig): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Response time tracking middleware
 */
export declare function responseTimeMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security headers middleware
 */
export declare function securityHeadersMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request size limiting middleware
 */
export declare function requestSizeLimitMiddleware(maxSize?: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Static asset optimization middleware
 */
export declare function staticAssetMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * API response optimization middleware
 */
export declare function apiOptimizationMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Conditional request handling middleware (ETag/Last-Modified)
 */
export declare function conditionalRequestMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Response {
            cache(options?: CacheOptions): Response;
            noCache(): Response;
        }
    }
}
