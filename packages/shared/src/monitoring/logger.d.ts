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
import { SecurityEvent } from '../types/security';
declare class VoxLinkLogger {
    private winston;
    private serviceName;
    constructor(serviceName?: string);
    private createLogger;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    logRequest(method: string, path: string, context?: LogContext): void;
    logResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void;
    logPerformance(metric: PerformanceMetric, context?: LogContext): void;
    logBusinessMetric(metric: BusinessMetric, context?: LogContext): void;
    logSecurityEvent(event: SecurityEvent, context?: LogContext): void;
    logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, context?: LogContext): void;
    logExternalServiceCall(service: string, operation: string, duration: number, success: boolean, context?: LogContext): void;
    logUserAction(action: string, userId: string, resource?: string, context?: LogContext): void;
    logSystemEvent(event: string, severity: 'info' | 'warn' | 'error', context?: LogContext): void;
    logHealthCheck(component: string, status: 'healthy' | 'unhealthy' | 'degraded', details?: any, context?: LogContext): void;
    logAuditEvent(action: string, resource: string, userId?: string, changes?: any, context?: LogContext): void;
    child(additionalContext: LogContext): VoxLinkLogger;
    getWinstonLogger(): winston.Logger;
}
export declare function createLogger(serviceName: string): VoxLinkLogger;
export declare const logger: VoxLinkLogger;
export declare function measurePerformance<T>(operation: string, fn: () => Promise<T>, context?: LogContext): Promise<T>;
export declare function createRequestLogger(serviceName: string): (req: any, res: any, next: any) => void;
export {};
