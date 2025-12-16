export interface SystemHealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    lastCheck: Date;
    details?: Record<string, any>;
}
export interface SystemIntegrationStatus {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: SystemHealthCheck[];
    integrations: IntegrationHealthCheck[];
    realTimeConnections: RealtimeConnectionStatus;
    dataConsistency: DataConsistencyCheck;
    performanceMetrics: SystemPerformanceMetrics;
}
export interface IntegrationHealthCheck {
    name: string;
    type: 'database' | 'external_api' | 'messaging' | 'storage';
    status: 'connected' | 'disconnected' | 'error';
    latency: number;
    lastSync: Date;
    errorCount: number;
}
export interface RealtimeConnectionStatus {
    websocketConnections: number;
    activeChannels: string[];
    messageLatency: number;
    connectionErrors: number;
}
export interface DataConsistencyCheck {
    status: 'consistent' | 'inconsistent' | 'checking';
    lastCheck: Date;
    inconsistencies: string[];
    autoRepairAttempts: number;
}
export interface SystemPerformanceMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    throughput: {
        callsPerMinute: number;
        messagesPerMinute: number;
        apiRequestsPerMinute: number;
    };
}
export declare class SystemHealthService {
    private circuitBreaker;
    private performanceMonitor;
    private healthChecks;
    private integrationChecks;
    constructor();
    private initializeHealthChecks;
    performSystemHealthCheck(): Promise<SystemIntegrationStatus>;
    private checkAllServices;
    private checkServiceHealth;
    private checkAllIntegrations;
    private checkIntegrationHealth;
    private checkDatabaseConnection;
    private checkExternalAPI;
    private checkStorageConnection;
    private checkWebSocketHealth;
    private checkRealtimeConnections;
    private checkDataConsistency;
    private validateDataConsistency;
    private getPerformanceMetrics;
    private calculateOverallStatus;
    repairSystemIssues(): Promise<void>;
    private repairService;
    private repairIntegration;
    optimizeSystemPerformance(): Promise<void>;
    private optimizeCPUUsage;
    private optimizeMemoryUsage;
    private optimizeNetworkPerformance;
    private optimizeDatabasePerformance;
    private optimizeCaching;
}
export declare const systemHealthService: SystemHealthService;
