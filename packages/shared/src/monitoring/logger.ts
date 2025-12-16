import winston from 'winston';

export interface LogContext {
  service?: string;
  requestId?: string;
  userId?: string;
  apiKeyId?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: any;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface BusinessMetric {
  metric: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

// Import SecurityEvent from types to avoid duplication
import { SecurityEvent } from '../types/security';

export class VoxLinkLogger {
  private winston: winston.Logger;
  private serviceName: string;

  constructor(serviceName: string = 'voxlink-service') {
    this.serviceName = serviceName;
    this.winston = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logFormat = process.env.LOG_FORMAT || 'json';
    const enableConsole = process.env.ENABLE_CONSOLE_LOGGING !== 'false';
    const enableFile = process.env.ENABLE_FILE_LOGGING === 'true';

    // Custom format for structured logging
    const structuredFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          service: this.serviceName,
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          ...meta,
        });
      })
    );

    const logger = winston.createLogger({
      level: logLevel,
      format: structuredFormat,
      defaultMeta: {
        service: this.serviceName,
      },
      transports: [],
    });

    // Console transport
    if (enableConsole) {
      logger.add(new winston.transports.Console({
        format: logFormat === 'json'
          ? structuredFormat
          : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
      }));
    }

    // File transports
    if (enableFile) {
      const logDir = process.env.LOG_DIR || 'logs';

      // General log file
      logger.add(new winston.transports.File({
        filename: `${logDir}/${this.serviceName}.log`,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      }));

      // Error log file
      logger.add(new winston.transports.File({
        filename: `${logDir}/${this.serviceName}-error.log`,
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      }));

      // Security events log file
      logger.add(new winston.transports.File({
        filename: `${logDir}/${this.serviceName}-security.log`,
        level: 'warn',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.printf((info) => {
            if (info.eventType === 'security') {
              return JSON.stringify(info);
            }
            return '';
          })
        ),
      }));
    }

    return logger;
  }

  // Basic logging methods
  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, context);
  }

  error(message: string, context?: LogContext): void {
    this.winston.error(message, context);
  }

  // Structured logging methods
  logRequest(method: string, path: string, context?: LogContext): void {
    this.info('HTTP Request', {
      eventType: 'request',
      method,
      path,
      ...context,
    });
  }

  logResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
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

  logPerformance(metric: PerformanceMetric, context?: LogContext): void {
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

  logBusinessMetric(metric: BusinessMetric, context?: LogContext): void {
    this.info('Business Metric', {
      eventType: 'business',
      ...metric,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logSecurityEvent(event: SecurityEvent, context?: LogContext): void {
    const level = event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warn';

    this.winston.log(level, 'Security Event', {
      eventType: 'security',
      ...event,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, context?: LogContext): void {
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

  logExternalServiceCall(service: string, operation: string, duration: number, success: boolean, context?: LogContext): void {
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

  logUserAction(action: string, userId: string, resource?: string, context?: LogContext): void {
    this.info('User Action', {
      eventType: 'user_action',
      action,
      userId,
      resource,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logSystemEvent(event: string, severity: 'info' | 'warn' | 'error', context?: LogContext): void {
    this.winston.log(severity, 'System Event', {
      eventType: 'system',
      event,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Health check logging
  logHealthCheck(component: string, status: 'healthy' | 'unhealthy' | 'degraded', details?: any, context?: LogContext): void {
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
  logAuditEvent(action: string, resource: string, userId?: string, changes?: any, context?: LogContext): void {
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
  child(additionalContext: LogContext): VoxLinkLogger {
    const childLogger = new VoxLinkLogger(this.serviceName);

    // Override the winston logger to include additional context
    const originalLog = childLogger.winston.log.bind(childLogger.winston);
    (childLogger.winston.log as any) = (level: any, message: any, meta: any = {}) => {
      return originalLog(level, message, { ...additionalContext, ...meta });
    };

    return childLogger;
  }

  // Get the underlying winston logger for advanced usage
  getWinstonLogger(): winston.Logger {
    return this.winston;
  }
}

// Create and export logger instance
export function createLogger(serviceName: string): VoxLinkLogger {
  return new VoxLinkLogger(serviceName);
}

// Default logger instance
export const logger = new VoxLinkLogger('voxlink-default');

// Performance monitoring helper
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now();

  return fn()
    .then((result) => {
      const duration = Date.now() - startTime;
      logger.logPerformance({
        operation,
        duration,
        success: true,
      }, context);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      logger.logPerformance({
        operation,
        duration,
        success: false,
        metadata: { error: error.message },
      }, context);
      throw error;
    });
}

// Request logging middleware factory
export function createRequestLogger(serviceName: string) {
  const serviceLogger = createLogger(serviceName);

  return (req: any, res: any, next: any) => {
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
    res.json = function (data: any) {
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