import { EventEmitter } from 'events';
export interface ScalingMetrics {
    cpu: number;
    memory: number;
    requestRate: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
}
export interface ScalingRule {
    id: string;
    name: string;
    metric: keyof ScalingMetrics;
    operator: 'gt' | 'lt' | 'gte' | 'lte';
    threshold: number;
    action: 'scale_up' | 'scale_down';
    cooldownPeriod: number;
    minInstances: number;
    maxInstances: number;
    scaleAmount: number;
    enabled: boolean;
}
export interface ScalingAction {
    id: string;
    rule: ScalingRule;
    action: 'scale_up' | 'scale_down';
    currentInstances: number;
    targetInstances: number;
    timestamp: Date;
    reason: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    error?: string;
}
export interface ServiceInstance {
    id: string;
    serviceName: string;
    status: 'starting' | 'running' | 'stopping' | 'stopped';
    startTime: Date;
    lastHealthCheck?: Date;
    healthStatus: 'healthy' | 'unhealthy' | 'unknown';
    metrics: ScalingMetrics;
}
export declare class AutoScalingService extends EventEmitter {
    private services;
    private scalingRules;
    private scalingActions;
    private lastScalingAction;
    private monitoringInterval?;
    private isMonitoring;
    constructor();
    /**
     * Start auto-scaling monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop auto-scaling monitoring
     */
    stopMonitoring(): void;
    /**
     * Register a service for auto-scaling
     */
    registerService(serviceName: string, initialInstances?: ServiceInstance[]): void;
    /**
     * Add scaling rule for a service
     */
    addScalingRule(serviceName: string, rule: ScalingRule): void;
    /**
     * Remove scaling rule
     */
    removeScalingRule(serviceName: string, ruleId: string): boolean;
    /**
     * Update service instance metrics
     */
    updateInstanceMetrics(serviceName: string, instanceId: string, metrics: ScalingMetrics): void;
    /**
     * Get current instances for a service
     */
    getServiceInstances(serviceName: string): ServiceInstance[];
    /**
     * Get scaling rules for a service
     */
    getScalingRules(serviceName: string): ScalingRule[];
    /**
     * Get recent scaling actions
     */
    getScalingActions(limit?: number): ScalingAction[];
    /**
     * Get scaling statistics
     */
    getScalingStats(): {
        totalServices: number;
        totalInstances: number;
        healthyInstances: number;
        unhealthyInstances: number;
        recentScalingActions: number;
        avgResponseTime: number;
        avgCpuUsage: number;
        avgMemoryUsage: number;
    };
    /**
     * Manually trigger scaling action
     */
    manualScale(serviceName: string, action: 'scale_up' | 'scale_down', amount?: number): Promise<ScalingAction>;
    /**
     * Evaluate all scaling rules for all services
     */
    private evaluateScalingRules;
    /**
     * Calculate aggregate metrics from all instances
     */
    private calculateAggregateMetrics;
    /**
     * Evaluate if a scaling rule should trigger
     */
    private evaluateRule;
    /**
     * Trigger a scaling action
     */
    private triggerScalingAction;
    /**
     * Execute a scaling action
     */
    private executeScalingAction;
    /**
     * Perform the actual scaling operation
     */
    private performScaling;
    /**
     * Determine health status based on metrics
     */
    private determineHealthStatus;
    /**
     * Setup default scaling rules
     */
    private setupDefaultRules;
}
export declare const autoScalingService: AutoScalingService;
