import { Request, Response } from 'express';
export interface HealthCheckResult {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    details?: any;
    error?: string;
}
export interface SystemHealth {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: HealthCheckResult[];
    system: {
        memory: NodeJS.MemoryUsage;
        cpu: NodeJS.CpuUsage;
        platform: string;
        nodeVersion: string;
    };
}
export type HealthCheck = () => Promise<HealthCheckResult>;
export declare class HealthCheckManager {
    private checks;
    private serviceName;
    constructor(serviceName: string);
    register(name: string, check: HealthCheck): void;
    unregister(name: string): void;
    runChecks(): Promise<HealthCheckResult[]>;
    getSystemHealth(): Promise<SystemHealth>;
    healthEndpoint(): (req: Request, res: Response) => Promise<void>;
    livenessEndpoint(): (req: Request, res: Response) => void;
    readinessEndpoint(criticalChecks?: string[]): (req: Request, res: Response) => Promise<void>;
}
export declare const commonHealthChecks: {
    database: (connectionTest: () => Promise<boolean>) => HealthCheck;
    redis: (pingTest: () => Promise<boolean>) => HealthCheck;
    externalService: (serviceName: string, url: string) => HealthCheck;
    memory: (maxMemoryMB?: number) => HealthCheck;
    diskSpace: (maxUsagePercent?: number) => HealthCheck;
    custom: (name: string, checkFn: () => Promise<{
        healthy: boolean;
        details?: any;
    }>) => HealthCheck;
};
export declare class MetricsCollector {
    private metrics;
    private serviceName;
    constructor(serviceName: string);
    increment(metric: string, tags?: Record<string, string>): void;
    gauge(metric: string, value: number, tags?: Record<string, string>): void;
    histogram(metric: string, value: number, tags?: Record<string, string>): void;
    getMetrics(): Record<string, any>;
    clear(): void;
    private getMetricKey;
}
export declare const metrics: MetricsCollector;
