import { Request, Response, NextFunction } from 'express';
interface PerformanceMetrics {
    requestId: string;
    method: string;
    url: string;
    userAgent?: string;
    ip: string;
    startTime: number;
    endTime?: number;
    responseTime?: number;
    statusCode?: number;
    contentLength?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
}
interface ApiEndpointStats {
    endpoint: string;
    method: string;
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    lastAccessed: Date;
}
export declare class PerformanceMonitoringService {
    private static instance;
    private queryOptimizer;
    private metrics;
    private endpointStats;
    private slowRequestThreshold;
    private maxMetricsRetention;
    constructor();
    static getInstance(): PerformanceMonitoringService;
    /**
     * Middleware to track request performance
     */
    trackRequest(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Record response metrics
     */
    private recordResponseMetrics;
    /**
     * Update endpoint statistics
     */
    private updateEndpointStats;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): {
        totalRequests: number;
        averageResponseTime: number;
        slowRequests: number;
        errorRate: number;
        topSlowEndpoints: ApiEndpointStats[];
        memoryUsage: NodeJS.MemoryUsage;
        uptime: number;
    };
    /**
     * Get endpoint-specific statistics
     */
    getEndpointStats(endpoint?: string): ApiEndpointStats[];
    /**
     * Get recent slow requests
     */
    getSlowRequests(limit?: number): PerformanceMetrics[];
    /**
     * Get query optimization suggestions
     */
    getQueryOptimizationSuggestions(): {
        slowQueries: any;
        indexSuggestions: any;
        queryStats: any;
    };
    /**
     * Record database query metrics
     */
    recordQueryMetrics(query: string, executionTime: number, rowsAffected: number): void;
    /**
     * Health check endpoint data
     */
    getHealthMetrics(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;
        errorRate: number;
        memoryUsage: number;
        cpuUsage: number;
        uptime: number;
    };
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    private generateRequestId;
    private normalizeUrl;
    private calculateErrorRate;
    private cleanupMetrics;
}
/**
 * Express middleware factory
 */
export declare function createPerformanceMonitoringMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Database query tracking middleware
 */
export declare function trackDatabaseQuery(query: string, executionTime: number, rowsAffected: number): void;
export {};
