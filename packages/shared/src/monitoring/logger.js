"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
exports.measurePerformance = measurePerformance;
exports.createRequestLogger = createRequestLogger;
const winston_1 = __importDefault(require("winston"));
class VoxLinkLogger {
    constructor(serviceName = 'voxlink-service') {
        this.serviceName = serviceName;
        this.winston = this.createLogger();
    }
    createLogger() {
        const logLevel = process.env.LOG_LEVEL || 'info';
        const logFormat = process.env.LOG_FORMAT || 'json';
        const enableConsole = process.env.ENABLE_CONSOLE_LOGGING !== 'false';
        const enableFile = process.env.ENABLE_FILE_LOGGING === 'true';
        // Custom format for structured logging
        const structuredFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                message,
                service: this.serviceName,
                environment: process.env.NODE_ENV || 'development',
                version: process.env.npm_package_version || '1.0.0',
                ...meta,
            });
        }));
        const logger = winston_1.default.createLogger({
            level: logLevel,
            format: structuredFormat,
            defaultMeta: {
                service: this.serviceName,
            },
            transports: [],
        });
        // Console transport
        if (enableConsole) {
            logger.add(new winston_1.default.transports.Console({
                format: logFormat === 'json'
                    ? structuredFormat
                    : winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
            }));
        }
        // File transports
        if (enableFile) {
            const logDir = process.env.LOG_DIR || 'logs';
            // General log file
            logger.add(new winston_1.default.transports.File({
                filename: `${logDir}/${this.serviceName}.log`,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                tailable: true,
            }));
            // Error log file
            logger.add(new winston_1.default.transports.File({
                filename: `${logDir}/${this.serviceName}-error.log`,
                level: 'error',
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                tailable: true,
            }));
            // Security events log file
            logger.add(new winston_1.default.transports.File({
                filename: `${logDir}/${this.serviceName}-security.log`,
                level: 'warn',
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 10,
                tailable: true,
                format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.printf((info) => {
                    if (info.eventType === 'security') {
                        return JSON.stringify(info);
                    }
                    return '';
                })),
            }));
        }
        return logger;
    }
    // Basic logging methods
    debug(message, context) {
        this.winston.debug(message, context);
    }
    info(message, context) {
        this.winston.info(message, context);
    }
    warn(message, context) {
        this.winston.warn(message, context);
    }
    error(message, context) {
        this.winston.error(message, context);
    }
    // Structured logging methods
    logRequest(method, path, context) {
        this.info('HTTP Request', {
            eventType: 'request',
            method,
            path,
            ...context,
        });
    }
    logResponse(method, path, statusCode, duration, context) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        this.winston.log(level, 'HTTP Response', {
            eventType: 'response',
            method,
            path,
            statusCode,
            duration,
            ...context,
        });
    }
    logPerformance(metric, context) {
        this.info('Performance Metric', {
            eventType: 'performance',
            ...metric,
            ...context,
        });
        // Log slow operations as warnings
        if (metric.duration > 5000) {
            this.warn('Slow Operation Detected', {
                eventType: 'performance',
                operation: metric.operation,
                duration: metric.duration,
                threshold: 5000,
                ...context,
            });
        }
    }
    logBusinessMetric(metric, context) {
        this.info('Business Metric', {
            eventType: 'business',
            ...metric,
            timestamp: new Date().toISOString(),
            ...context,
        });
    }
    logSecurityEvent(event, context) {
        const level = event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warn';
        this.winston.log(level, 'Security Event', {
            eventType: 'security',
            ...event,
            timestamp: new Date().toISOString(),
            ...context,
        });
    }
    logDatabaseOperation(operation, table, duration, success, context) {
        this.info('Database Operation', {
            eventType: 'database',
            operation,
            table,
            duration,
            success,
            ...context,
        });
        if (duration > 1000) {
            this.warn('Slow Database Query', {
                eventType: 'database',
                operation,
                table,
                duration,
                threshold: 1000,
                ...context,
            });
        }
    }
    logExternalServiceCall(service, operation, duration, success, context) {
        this.info('External Service Call', {
            eventType: 'external_service',
            service,
            operation,
            duration,
            success,
            ...context,
        });
        if (!success) {
            this.error('External Service Call Failed', {
                eventType: 'external_service',
                service,
                operation,
                duration,
                success,
                ...context,
            });
        }
    }
    logUserAction(action, userId, resource, context) {
        this.info('User Action', {
            eventType: 'user_action',
            action,
            userId,
            resource,
            timestamp: new Date().toISOString(),
            ...context,
        });
    }
    logSystemEvent(event, severity, context) {
        this.winston.log(severity, 'System Event', {
            eventType: 'system',
            event,
            timestamp: new Date().toISOString(),
            ...context,
        });
    }
    // Health check logging
    logHealthCheck(component, status, details, context) {
        const level = status === 'healthy' ? 'info' : 'error';
        this.winston.log(level, 'Health Check', {
            eventType: 'health_check',
            component,
            status,
            details,
            timestamp: new Date().toISOString(),
            ...context,
        });
    }
    // Audit logging
    logAuditEvent(action, resource, userId, changes, context) {
        this.info('Audit Event', {
            eventType: 'audit',
            action,
            resource,
            userId,
            changes,
            timestamp: new Date().toISOString(),
            ...context,
        });
    }
    // Create child logger with additional context
    child(additionalContext) {
        const childLogger = new VoxLinkLogger(this.serviceName);
        // Override the winston logger to include additional context
        const originalLog = childLogger.winston.log.bind(childLogger.winston);
        childLogger.winston.log = (level, message, meta = {}) => {
            return originalLog(level, message, { ...additionalContext, ...meta });
        };
        return childLogger;
    }
    // Get the underlying winston logger for advanced usage
    getWinstonLogger() {
        return this.winston;
    }
}
// Create and export logger instance
function createLogger(serviceName) {
    return new VoxLinkLogger(serviceName);
}
// Default logger instance
exports.logger = new VoxLinkLogger('voxlink-default');
// Performance monitoring helper
function measurePerformance(operation, fn, context) {
    const startTime = Date.now();
    return fn()
        .then((result) => {
        const duration = Date.now() - startTime;
        exports.logger.logPerformance({
            operation,
            duration,
            success: true,
        }, context);
        return result;
    })
        .catch((error) => {
        const duration = Date.now() - startTime;
        exports.logger.logPerformance({
            operation,
            duration,
            success: false,
            metadata: { error: error.message },
        }, context);
        throw error;
    });
}
// Request logging middleware factory
function createRequestLogger(serviceName) {
    const serviceLogger = createLogger(serviceName);
    return (req, res, next) => {
        const startTime = Date.now();
        const requestId = req.get('X-Request-ID') || 'unknown';
        // Create child logger with request context
        req.logger = serviceLogger.child({
            requestId,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        // Log incoming request
        req.logger.logRequest(req.method, req.path, {
            query: req.query,
            userId: req.user?.id,
            apiKeyId: req.apiKey?.id,
        });
        // Override res.json to log response
        const originalJson = res.json;
        res.json = function (data) {
            const duration = Date.now() - startTime;
            req.logger.logResponse(req.method, req.path, res.statusCode, duration, {
                responseSize: JSON.stringify(data).length,
                userId: req.user?.id,
                apiKeyId: req.apiKey?.id,
            });
            return originalJson.call(this, data);
        };
        next();
    };
}
