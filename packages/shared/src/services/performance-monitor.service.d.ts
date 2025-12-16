import { EventEmitter } from 'events';
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags?: Record<string, string>;
}
export interface PerformanceThreshold {
    metric: string;
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
    value: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
}
export interface PerformanceAlert {
    id: string;
    metric: string;
    threshold: PerformanceThreshold;
    currentValue: number;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    resolved: boolean;
    resolvedAt?: Date;
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number;
    metrics: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
        database: number;
        cache: number;
    };
    services: {
        [serviceName: string]: {
            status: 'up' | 'down' | 'degraded';
            responseTime: number;
            errorRate: number;
        };
    };
    timestamp: Date;
}
export declare class PerformanceMonitorService extends EventEmitter {
    private metrics;
    private thresholds;
    private alerts;
    private isMonitoring;
    private monitoringInterval?;
    private metricsRetentionPeriod;
    constructor();
    /**
     * Start performance monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Record a performance metric
     */
    recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void;
    /**
     * Get metrics for a specific name
     */
    getMetrics(name: string, since?: Date): PerformanceMetric[];
    /**
     * Get all metric names
     */
    getMetricNames(): string[];
    /**
     * Get system health status
     */
    getSystemHealth(): Promise<SystemHealth>;
    /**
     * Add performance threshold
     */
    addThreshold(threshold: PerformanceThreshold): void;
    /**
     * Get active alerts
     */
    getActiveAlerts(): PerformanceAlert[];
    /**
     * Get all alerts
     */
    getAllAlerts(limit?: number): PerformanceAlert[];
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): void;
    /**
     * Get performance summary
     */
    getPerformanceSummary(timeRange?: number): {
        totalMetrics: number;
        activeAlerts: number;
        avgResponseTime: number;
        errorRate: number;
        throughput: number;
    };
    /**
     * Setup default performance thresholds
     */
    private setupDefaultThresholds;
    /**
     * Collect system metrics
     */
    private collectSystemMetrics;
    /**
     * Check if metric violates any thresholds
     */
    private checkThresholds;
    /**
     * Evaluate if a value violates a threshold
     */
    private evaluateThreshold;
    /**
     * Calculate average of metrics
     */
    private calculateAverage;
    /**
     * Calculate overall health score
     */
    private calculateHealthScore;
    /**
     * Get service health status
     */
    private getServiceHealth;
    private getCPUUsage;
    private getMemoryUsage;
    private getDiskUsage;
    private getNetworkLatency;
    /**
     * Get system metrics for SystemHealthService compatibility
     */
    getSystemMetrics(): Promise<{
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
        throughput: {
            callsPerMinute: number;
            messagesPerMinute: number;
            apiRequestsPerMinute: number;
        };
    }>;
}
export declare const performanceMonitor: PerformanceMonitorService;
