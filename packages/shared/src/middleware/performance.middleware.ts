import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { logger } from '../monitoring/logger';

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
export function createCompressionMiddleware(config: PerformanceConfig = {}) {
  const options = {
    enableCompression: true,
    compressionLevel: 6,
    compressionThreshold: 1024,
    ...config,
  };

  if (!options.enableCompression) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return compression({
    level: options.compressionLevel,
    threshold: options.compressionThreshold,
    filter: (req, res) => {
      // Don't compress if client doesn't support it
      if (!req.headers['accept-encoding']) {
        return false;
      }

      // Don't compress already compressed content
      const contentType = res.getHeader('content-type') as string;
      if (contentType && (
        contentType.includes('image/') ||
        contentType.includes('video/') ||
        contentType.includes('audio/') ||
        contentType.includes('application/zip') ||
        contentType.includes('application/gzip')
      )) {
        return false;
      }

      // Use compression for text-based content
      return compression.filter(req, res);
    },
  });
}

/**
 * Cache headers middleware
 */
export function createCacheMiddleware(config: PerformanceConfig = {}) {
  const options = {
    enableCaching: true,
    defaultCacheTtl: 3600, // 1 hour
    enableEtag: true,
    enableLastModified: true,
    ...config,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!options.enableCaching) {
      return next();
    }

    // Add cache control helper method
    res.cache = (cacheOptions: CacheOptions = {}) => {
      const {
        ttl = options.defaultCacheTtl,
        private: isPrivate = false,
        noCache = false,
        noStore = false,
        mustRevalidate = false,
        immutable = false,
        staleWhileRevalidate,
        staleIfError,
      } = cacheOptions;

      const directives: string[] = [];

      if (noStore) {
        directives.push('no-store');
      } else if (noCache) {
        directives.push('no-cache');
      } else {
        directives.push(isPrivate ? 'private' : 'public');
        directives.push(`max-age=${ttl}`);

        if (immutable) {
          directives.push('immutable');
        }

        if (mustRevalidate) {
          directives.push('must-revalidate');
        }

        if (staleWhileRevalidate) {
          directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
        }

        if (staleIfError) {
          directives.push(`stale-if-error=${staleIfError}`);
        }
      }

      res.setHeader('Cache-Control', directives.join(', '));
      return res;
    };

    // Add no-cache helper
    res.noCache = () => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res;
    };

    // Enable ETag if configured
    if (options.enableEtag) {
      res.setHeader('ETag', `"${Date.now()}"`);
    }

    // Enable Last-Modified if configured
    if (options.enableLastModified) {
      res.setHeader('Last-Modified', new Date().toUTCString());
    }

    next();
  };
}

/**
 * Response time tracking middleware
 */
export function responseTimeMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);

      // Log slow responses
      if (responseTime > 1000) {
        logger.warn('Slow response detected', {
          method: req.method,
          url: req.url,
          responseTime,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  };
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Strict transport security (HTTPS only)
    if (req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
  };
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimitMiddleware(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: 'Request entity too large',
          maxSize,
          receivedSize: formatBytes(sizeInBytes),
        });
      }
    }

    next();
  };
}

/**
 * Static asset optimization middleware
 */
export function staticAssetMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const url = req.url;
    const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(url);

    if (isStaticAsset) {
      // Long-term caching for static assets
      res.cache({
        ttl: 31536000, // 1 year
        immutable: true,
      });

      // Add Vary header for compressed content
      res.setHeader('Vary', 'Accept-Encoding');

      // Set appropriate content type
      const extension = url.split('.').pop()?.toLowerCase();
      const contentType = getContentType(extension || '');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
    }

    next();
  };
}

/**
 * API response optimization middleware
 */
export function apiOptimizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function(data: any) {
      // Add response metadata
      const responseData = {
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || generateRequestId(),
          version: process.env.API_VERSION || '1.0.0',
        },
      };

      // Set appropriate cache headers for API responses
      if (req.method === 'GET') {
        res.cache({ ttl: 300 }); // 5 minutes for GET requests
      } else {
        res.noCache();
      }

      return originalJson.call(this, responseData);
    };

    next();
  };
}

/**
 * Conditional request handling middleware (ETag/Last-Modified)
 */
export function conditionalRequestMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];

    // Store original send method
    const originalSend = res.send;

    res.send = function(data: any) {
      // Generate ETag for response
      const etag = generateETag(data);
      res.setHeader('ETag', etag);

      // Check if client has cached version
      if (ifNoneMatch === etag) {
        res.status(304).end();
        return res;
      }

      // Check Last-Modified
      const lastModified = res.getHeader('Last-Modified') as string;
      if (ifModifiedSince && lastModified) {
        const clientDate = new Date(ifModifiedSince);
        const serverDate = new Date(lastModified);
        
        if (clientDate >= serverDate) {
          res.status(304).end();
          return res;
        }
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

// Utility functions
function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * units[unit];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getContentType(extension: string): string | null {
  const mimeTypes: Record<string, string> = {
    'css': 'text/css',
    'js': 'application/javascript',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'ico': 'image/x-icon',
    'svg': 'image/svg+xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  };

  return mimeTypes[extension] || null;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function generateETag(data: any): string {
  const crypto = require('crypto');
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

// Extend Express Response interface
declare global {
  namespace Express {
    interface Response {
      cache(options?: CacheOptions): Response;
      noCache(): Response;
    }
  }
}