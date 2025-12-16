"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.ExternalServiceError = exports.ServiceUnavailableError = exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.VoxLinkError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
const logger_1 = require("./logger");
class VoxLinkError extends Error {
    constructor(message, statusCode = 500, code, details, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code || this.getDefaultCode(statusCode);
        this.details = details;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
    getDefaultCode(statusCode) {
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
exports.VoxLinkError = VoxLinkError;
// Specific error classes
class ValidationError extends VoxLinkError {
    constructor(message, details) {
        super(message, 422, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends VoxLinkError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends VoxLinkError {
    constructor(message, details) {
        super(message, 409, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends VoxLinkError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends VoxLinkError {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ServiceUnavailableError extends VoxLinkError {
    constructor(service, details) {
        super(`${service} service is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', details);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class ExternalServiceError extends VoxLinkError {
    constructor(service, originalError) {
        super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', { originalError: originalError?.message });
    }
}
exports.ExternalServiceError = ExternalServiceError;
// Error handler middleware
function errorHandler(serviceName) {
    return (error, req, res, next) => {
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
                userId: req.user?.id,
                apiKeyId: req.apiKey?.id,
            },
            timestamp: new Date().toISOString(),
        };
        if (statusCode >= 500) {
            logger_1.logger.error('Server error', errorLog);
        }
        else {
            logger_1.logger.warn('Client error', errorLog);
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
            errorResponse.error.stack = error.stack;
        }
        res.status(statusCode).json(errorResponse);
    };
}
// Async error wrapper
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Unhandled error handlers
function setupGlobalErrorHandlers(serviceName) {
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception', {
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
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled Rejection', {
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
function getPublicErrorMessage(error, statusCode) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        return 'An internal server error occurred';
    }
    return error.message || 'An error occurred';
}
function sanitizeRequestBody(body) {
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
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeRequestBody(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
// Error factory functions
exports.createError = {
    validation: (message, details) => new ValidationError(message, details),
    notFound: (resource, identifier) => new NotFoundError(resource, identifier),
    conflict: (message, details) => new ConflictError(message, details),
    unauthorized: (message) => new UnauthorizedError(message),
    forbidden: (message) => new ForbiddenError(message),
    serviceUnavailable: (service, details) => new ServiceUnavailableError(service, details),
    externalService: (service, originalError) => new ExternalServiceError(service, originalError),
    custom: (message, statusCode, code, details) => new VoxLinkError(message, statusCode, code, details),
};
