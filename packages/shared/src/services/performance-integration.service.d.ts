import { EventEmitter } from 'events';
import { CacheService } from './cache.service';
import { QueryOptimizerService } from './query-optimizer.service';
import { CDNService } from './cdn.service';
export interface PerformanceConfig {
    cache: {
        enabled: boolean;
        host: string;
        port: number;
        password?: string;
        keyPrefix: string;
        defaultTtl: number;
    };
    cdn: {
        enabled: boolean;
        provider: 'cloudflare' | 'aws' | 'azure' | 'gcp';
        baseUrl: string;
        apiKey?: string;
        zoneId?: string;
    };
    monitoring: {
        enabled: boolean;
        metricsInterval: number;
        alertThresholds: {
            responseTime: number;
            errorRate: number;
            cpuUsage: number;
            memoryUsage: number;
        };
    };
    autoScaling: {
        enabled: boolean;
        monitoringInterval: number;
        defaultRules: boolean;
    };
    circuitBreaker: {
        enabled: boolean;
        defaultConfig: {
            failureThreshold: number;
            recoveryTimeout: number;
            monitoringPeriod: number;
        };
    };
    queryOptimization: {
        enabled: boolean;
        slowQueryThreshold: number;
        autoIndexSuggestions: boolean;
    };
}
export interface PerformanceMetrics {
    cache: {
        hitRate: number;
        totalRequests: number;
        responseTime: number;
        errorRate: number;
    };
    database: {
        averageQueryTime: number;
        slowQueries: number;
        connectionPoolUsage: number;
    };
    system: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
    };
    application: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        activeConnections: number;
    };
    cdn: {
        hitRate: number;
        bandwidth: number;
        requests: number;
    };
}
export interface PerformanceReport {
    timestamp: Date;
    overall: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        score: number;
        recommendations: string[];
    };
    metrics: PerformanceMetrics;
    services: {
        [serviceName: string]: {
            status: 'up' | 'down' | 'degraded';
            responseTime: number;
            errorRate: number;
            circuitBreakerState: string;
        };
    };
    optimizations: {
        cacheOptimizations: string[];
        queryOptimizations: string[];
        scalingRecommendations: string[];
        cdnOptimizations: string[];
    };
}
export declare class PerformanceIntegrationService extends EventEmitter {
    private cacheService?;
    private queryOptimizer;
    private cdnService?;
    private config;
    private isInitialized;
    private metricsInterval?;
    constructor(config: PerformanceConfig);
    /**
     * Initialize all performance services
     */
    initialize(): Promise<void>;
    /**
     * Shutdown all performance services
     */
    shutdown(): Promise<void>;
    /**
     * Get comprehensive performance report
     */
    getPerformanceReport(): Promise<PerformanceReport>;
    /**
     * Optimize performance based on current metrics
     */
    optimizePerformance(): Promise<{
        applied: string[];
        scheduled: string[];
        failed: string[];
    }>;
    /**
     * Get cache service instance
     */
    getCacheService(): CacheService | undefined;
    /**
     * Get CDN service instance
     */
    getCDNService(): CDNService | undefined;
    /**
     * Get query optimizer instance
     */
    getQueryOptimizer(): QueryOptimizerService;
    /**
     * Check if service is healthy
     */
    isHealthy(): Promise<boolean>;
    /**
     * Setup alert thresholds for monitoring
     */
    private setupAlertThresholds;
    /**
     * Setup default auto-scaling rules
     */
    private setupDefaultScalingRules;
    /**
     * Setup circuit breaker event handlers
     */
    private setupCircuitBreakerEvents;
    /**
     * Start collecting metrics from all services
     */
    private startMetricsCollection;
    /**
     * Collect and report metrics from all services
     */
    private collectAndReportMetrics;
    /**
     * Generate performance recommendations
     */
    private generateRecommendations;
    private getCacheResponseTime;
    private getDatabaseConnectionUsage;
    private getApplicationResponseTime;
    private getApplicationThroughput;
    private getApplicationErrorRate;
    private getCDNMetrics;
    private applyCacheOptimizations;
    private applyQueryOptimizations;
    private applyCDNOptimizations;
    private applyScalingOptimizations;
}
