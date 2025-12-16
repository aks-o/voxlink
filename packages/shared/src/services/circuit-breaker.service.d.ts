import { EventEmitter } from 'events';
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    volumeThreshold: number;
    errorThresholdPercentage: number;
    halfOpenMaxCalls: number;
}
export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerStats {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    totalRequests: number;
    errorRate: number;
    lastFailureTime?: Date;
    lastSuccessTime?: Date;
    nextAttemptTime?: Date;
}
export declare class CircuitBreakerService extends EventEmitter {
    private circuits;
    private defaultConfig;
    constructor();
    /**
     * Create or get a circuit breaker for a service
     */
    getCircuit(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreakerInstance;
    /**
     * Execute a function with circuit breaker protection
     */
    execute<T>(serviceName: string, fn: () => Promise<T>, config?: Partial<CircuitBreakerConfig>): Promise<T>;
    /**
     * Get statistics for all circuits
     */
    getAllStats(): Record<string, CircuitBreakerStats>;
    /**
     * Get statistics for a specific circuit
     */
    getStats(serviceName: string): CircuitBreakerStats | null;
    /**
     * Reset a circuit breaker
     */
    reset(serviceName: string): boolean;
    /**
     * Force open a circuit breaker
     */
    forceOpen(serviceName: string): boolean;
    /**
     * Force close a circuit breaker
     */
    forceClose(serviceName: string): boolean;
    /**
     * Get health status of all circuits
     */
    getHealthStatus(): {
        healthy: string[];
        degraded: string[];
        unhealthy: string[];
        totalCircuits: number;
    };
    /**
     * Start reporting metrics to performance monitor
     */
    private startMetricsReporting;
    /**
     * Report circuit breaker metrics
     */
    private reportMetrics;
}
export declare class CircuitBreakerInstance extends EventEmitter {
    private serviceName;
    private config;
    private state;
    private failureCount;
    private successCount;
    private totalRequests;
    private lastFailureTime?;
    private lastSuccessTime?;
    private nextAttemptTime?;
    private halfOpenCallCount;
    private requestHistory;
    constructor(serviceName: string, config: CircuitBreakerConfig);
    /**
     * Execute a function with circuit breaker protection
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Get circuit breaker statistics
     */
    getStats(): CircuitBreakerStats;
    /**
     * Reset the circuit breaker
     */
    reset(): void;
    /**
     * Force the circuit breaker to open
     */
    forceOpen(): void;
    /**
     * Force the circuit breaker to close
     */
    forceClose(): void;
    /**
     * Handle successful execution
     */
    private onSuccess;
    /**
     * Handle failed execution
     */
    private onFailure;
    /**
     * Check if circuit should open based on failure criteria
     */
    private shouldOpen;
    /**
     * Check if we should attempt to reset from open to half-open
     */
    private shouldAttemptReset;
    /**
     * Move circuit to closed state
     */
    private moveToClosed;
    /**
     * Move circuit to open state
     */
    private moveToOpen;
    /**
     * Move circuit to half-open state
     */
    private moveToHalfOpen;
    /**
     * Calculate current error rate
     */
    private calculateErrorRate;
    /**
     * Add request result to history
     */
    private addToHistory;
}
export declare const circuitBreakerService: CircuitBreakerService;
