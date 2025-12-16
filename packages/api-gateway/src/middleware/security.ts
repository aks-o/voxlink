import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// Extend Request interface to include session
interface RequestWithSession extends Request {
  session?: {
    csrfToken?: string;
  };
}

export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  // Generate and set request ID for tracing
  const requestId = crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.set('X-Request-ID', requestId);

  // Log security-relevant information
  const securityInfo = {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempts
    /union\s+select/gi, // SQL injection
    /javascript:/gi, // JavaScript protocol
    /data:/gi, // Data protocol
    /vbscript:/gi, // VBScript protocol
  ];

  const requestString = `${req.path} ${JSON.stringify(req.query)} ${JSON.stringify(req.body)}`;
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(requestString));

  if (hasSuspiciousContent) {
    logger.warn('Suspicious request detected', {
      ...securityInfo,
      suspiciousContent: requestString,
    });

    return res.status(400).json({
      error: {
        code: 'SUSPICIOUS_REQUEST',
        message: 'Request contains potentially malicious content',
        requestId,
      },
    });
  }

  // Check for oversized requests
  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    logger.warn('Oversized request detected', {
      ...securityInfo,
      contentLength,
    });

    return res.status(413).json({
      error: {
        code: 'REQUEST_TOO_LARGE',
        message: 'Request payload too large',
        requestId,
      },
    });
  }

  // Validate Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    const allowedContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ];

    if (contentType && !allowedContentTypes.some(type => contentType.includes(type))) {
      logger.warn('Invalid content type', {
        ...securityInfo,
        contentType,
      });

      return res.status(415).json({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Unsupported content type',
          requestId,
        },
      });
    }
  }

  // Log all requests for security monitoring
  logger.info('Request received', securityInfo);

  next();
}

export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (apiKey) {
    // Validate API key format
    if (!apiKey.startsWith('vxl_') || apiKey.length < 20) {
      logger.warn('Invalid API key format', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        apiKeyPrefix: apiKey.substring(0, 8),
      });

      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY_FORMAT',
          message: 'API key format is invalid',
        },
      });
    }
  }

  next();
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF protection for API requests with API keys
  if (req.headers['x-api-key']) {
    return next();
  }

  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionCsrfToken = (req as RequestWithSession).session?.csrfToken;

  if (!csrfToken || !sessionCsrfToken || csrfToken !== sessionCsrfToken) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      hasToken: !!csrfToken,
      hasSessionToken: !!sessionCsrfToken,
    });

    return res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'CSRF token is missing or invalid',
      },
    });
  }

  next();
}

export function ipWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip;

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.warn('IP not in whitelist', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        allowedIPs,
      });

      return res.status(403).json({
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Your IP address is not authorized to access this resource',
        },
      });
    }

    next();
  };
}

export function requireHttps(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-forwarded-proto'] !== 'https' && req.protocol !== 'https') {
    logger.warn('Non-HTTPS request detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      protocol: req.protocol,
      forwardedProto: req.headers['x-forwarded-proto'],
    });

    return res.status(426).json({
      error: {
        code: 'HTTPS_REQUIRED',
        message: 'HTTPS is required for this endpoint',
      },
    });
  }

  next();
}