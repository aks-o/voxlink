import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export class VoxLinkError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'UNKNOWN_ERROR';
    }
  }
}

// Specific error classes
export class ValidationError extends VoxLinkError {
  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends VoxLinkError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends VoxLinkError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class UnauthorizedError extends VoxLinkError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends VoxLinkError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ServiceUnavailableError extends VoxLinkError {
  constructor(service: string, details?: any) {
    super(`${service} service is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

export class ExternalServiceError extends VoxLinkError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      { originalError: originalError?.message }
    );
  }
}

// Error handler middleware
export function errorHandler(serviceName: string) {
  return (error: ApiError, req: Request, res: Response, next: NextFunction) => {
    // If response was already sent, delegate to default Express error handler
    if (res.headersSent) {
      return next(error);
    }

    const requestId = req.get('X-Request-ID') || 'unknown';
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_SERVER_ERROR';
    const isOperational = error.isOperational !== false;

    // Log the error
    const errorLog = {
      service: serviceName,
      requestId,
      error: {
        name: error.name,
        message: error.message,
        code: errorCode,
        statusCode,
        stack: error.stack,
        details: error.details,
        isOperational,
      },
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: sanitizeRequestBody(req.body),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
        apiKeyId: (req as any).apiKey?.id,
      },
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= 500) {
      logger.error('Server error', errorLog);
    } else {
      logger.warn('Client error', errorLog);
    }

    // Send error response
    const errorResponse = {
      error: {
        code: errorCode,
        message: getPublicErrorMessage(error, statusCode),
        requestId,
        timestamp: new Date().toISOString(),
        ...(error.details && statusCode < 500 ? { details: error.details } : {}),
      },
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
      (errorResponse.error as any).stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
  };
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Unhandled error handlers
export function setupGlobalErrorHandlers(serviceName: string) {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      service: serviceName,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    });

    // Give time for logs to be written
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', {
      service: serviceName,
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
      timestamp: new Date().toISOString(),
    });

    // Don't exit on unhandled rejections in production
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
}

// Helper functions
function getPublicErrorMessage(error: ApiError, statusCode: number): string {
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    return 'An internal server error occurred';
  }

  return error.message || 'An error occurred';
}

function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'creditCard',
    'cvv',
    'ssn',
    'pin',
  ];

  const sanitized = Array.isArray(body) ? [] : {};

  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));

    if (isSensitive) {
      (sanitized as any)[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeRequestBody(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }

  return sanitized;
}

// Error factory functions
export const createError = {
  validation: (message: string, details?: any) => new ValidationError(message, details),
  notFound: (resource: string, identifier?: string) => new NotFoundError(resource, identifier),
  conflict: (message: string, details?: any) => new ConflictError(message, details),
  unauthorized: (message?: string) => new UnauthorizedError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  serviceUnavailable: (service: string, details?: any) => new ServiceUnavailableError(service, details),
  externalService: (service: string, originalError?: Error) => new ExternalServiceError(service, originalError),
  custom: (message: string, statusCode: number, code?: string, details?: any) => 
    new VoxLinkError(message, statusCode, code, details),
};