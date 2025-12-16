import { EventEmitter } from 'events';
import { logger } from '../monitoring/logger';
import { performanceMonitor } from './performance-monitor.service';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time in ms before attempting to close circuit
  monitoringPeriod: number; // Time window for failure counting
  volumeThreshold: number; // Minimum number of requests before circuit can open
  errorThresholdPercentage: number; // Percentage of errors that triggers circuit opening
  halfOpenMaxCalls: number; // Max calls allowed in half-open state
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
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

export class CircuitBreakerService extends EventEmitter {
  private circuits: Map<string, CircuitBreakerInstance> = new Map();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 60000, // 1 minute
    volumeThreshold: 10,
    errorThresholdPercentage: 50,
    halfOpenMaxCalls: 3,
  };

  constructor() {
    super();
    this.startMetricsReporting();
  }

  /**
   * Create or get a circuit breaker for a service
   */
  getCircuit(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreakerInstance {
    if (!this.circuits.has(serviceName)) {
      const circuitConfig = { ...this.defaultConfig, ...config };
      const circuit = new CircuitBreakerInstance(serviceName, circuitConfig);
      
      // Forward events
      circuit.on('stateChange', (state, previousState) => {
        this.emit('stateChange', serviceName, state, previousState);
        logger.info(`Circuit breaker ${serviceName} state changed: ${previousState} -> ${state}`);
      });

      circuit.on('failure', (error) => {
        this.emit('failure', serviceName, error);
      });

      circuit.on('success', () => {
        this.emit('success', serviceName);
      });

      this.circuits.set(serviceName, circuit);
    }

    return this.circuits.get(serviceName)!;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuit = this.getCircuit(serviceName, config);
    return circuit.execute(fn);
  }

  /**
   * Get statistics for all circuits
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [serviceName, circuit] of this.circuits.entries()) {
      stats[serviceName] = circuit.getStats();
    }

    return stats;
  }

  /**
   * Get statistics for a specific circuit
   */
  getStats(serviceName: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(serviceName);
    return circuit ? circuit.getStats() : null;
  }

  /**
   * Reset a circuit breaker
   */
  reset(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.reset();
      return true;
    }
    return false;
  }

  /**
   * Force open a circuit breaker
   */
  forceOpen(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.forceOpen();
      return true;
    }
    return false;
  }

  /**
   * Force close a circuit breaker
   */
  forceClose(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.forceClose();
      return true;
    }
    return false;
  }

  /**
   * Get health status of all circuits
   */
  getHealthStatus(): {
    healthy: string[];
    degraded: string[];
    unhealthy: string[];
    totalCircuits: number;
  } {
    const healthy: string[] = [];
    const degraded: string[] = [];
    const unhealthy: string[] = [];

    for (const [serviceName, circuit] of this.circuits.entries()) {
      const stats = circuit.getStats();
      
      if (stats.state === CircuitState.CLOSED && stats.errorRate < 10) {
        healthy.push(serviceName);
      } else if (stats.state === CircuitState.HALF_OPEN || stats.errorRate < 50) {
        degraded.push(serviceName);
      } else {
        unhealthy.push(serviceName);
      }
    }

    return {
      healthy,
      degraded,
      unhealthy,
      totalCircuits: this.circuits.size,
    };
  }

  /**
   * Start reporting metrics to performance monitor
   */
  private startMetricsReporting(): void {
    setInterval(() => {
      this.reportMetrics();
    }, 30000); // Report every 30 seconds
  }

  /**
   * Report circuit breaker metrics
   */
  private reportMetrics(): void {
    const healthStatus = this.getHealthStatus();
    
    performanceMonitor.recordMetric('circuit_breaker.healthy_count', healthStatus.healthy.length, 'count');
    performanceMonitor.recordMetric('circuit_breaker.degraded_count', healthStatus.degraded.length, 'count');
    performanceMonitor.recordMetric('circuit_breaker.unhealthy_count', healthStatus.unhealthy.length, 'count');
    performanceMonitor.recordMetric('circuit_breaker.total_count', healthStatus.totalCircuits, 'count');

    // Report individual circuit metrics
    for (const [serviceName, circuit] of this.circuits.entries()) {
      const stats = circuit.getStats();
      performanceMonitor.recordMetric(
        'circuit_breaker.error_rate',
        stats.errorRate,
        'percent',
        { service: serviceName }
      );
      performanceMonitor.recordMetric(
        'circuit_breaker.total_requests',
        stats.totalRequests,
        'count',
        { service: serviceName }
      );
    }
  }
}

export class CircuitBreakerInstance extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private halfOpenCallCount = 0;
  private requestHistory: Array<{ timestamp: number; success: boolean }> = [];

  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig
  ) {
    super();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.moveToHalfOpen();
      } else {
        throw new Error(`Circuit breaker is OPEN for service: ${this.serviceName}`);
      }
    }

    if (this.state === CircuitState.HALF_OPEN && this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
      throw new Error(`Circuit breaker is HALF_OPEN and max calls exceeded for service: ${this.serviceName}`);
    }

    this.totalRequests++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCallCount++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      errorRate: this.calculateErrorRate(),
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.halfOpenCallCount = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    this.requestHistory = [];
    this.emit('stateChange', this.state, CircuitState.OPEN);
  }

  /**
   * Force the circuit breaker to open
   */
  forceOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
    this.emit('stateChange', this.state, previousState);
  }

  /**
   * Force the circuit breaker to close
   */
  forceClose(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCallCount = 0;
    this.nextAttemptTime = undefined;
    this.emit('stateChange', this.state, previousState);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    this.addToHistory(true);

    if (this.state === CircuitState.HALF_OPEN) {
      // If we've had enough successful calls in half-open state, close the circuit
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        this.moveToClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }

    this.emit('success');
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.addToHistory(false);

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state should open the circuit
      this.moveToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldOpen()) {
        this.moveToOpen();
      }
    }

    this.emit('failure', error);
  }

  /**
   * Check if circuit should open based on failure criteria
   */
  private shouldOpen(): boolean {
    // Check if we have enough volume
    if (this.totalRequests < this.config.volumeThreshold) {
      return false;
    }

    // Check failure threshold
    if (this.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Check error rate threshold
    const errorRate = this.calculateErrorRate();
    return errorRate >= this.config.errorThresholdPercentage;
  }

  /**
   * Check if we should attempt to reset from open to half-open
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime.getTime() : false;
  }

  /**
   * Move circuit to closed state
   */
  private moveToClosed(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCallCount = 0;
    this.nextAttemptTime = undefined;
    this.emit('stateChange', this.state, previousState);
  }

  /**
   * Move circuit to open state
   */
  private moveToOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
    this.emit('stateChange', this.state, previousState);
  }

  /**
   * Move circuit to half-open state
   */
  private moveToHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenCallCount = 0;
    this.emit('stateChange', this.state, previousState);
  }

  /**
   * Calculate current error rate
   */
  private calculateErrorRate(): number {
    if (this.totalRequests === 0) {
      return 0;
    }

    // Calculate error rate from recent history
    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      req => now - req.timestamp <= this.config.monitoringPeriod
    );

    if (recentRequests.length === 0) {
      return 0;
    }

    const failures = recentRequests.filter(req => !req.success).length;
    return (failures / recentRequests.length) * 100;
  }

  /**
   * Add request result to history
   */
  private addToHistory(success: boolean): void {
    const now = Date.now();
    this.requestHistory.push({ timestamp: now, success });

    // Keep only recent history
    this.requestHistory = this.requestHistory.filter(
      req => now - req.timestamp <= this.config.monitoringPeriod
    );

    // Limit history size
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }
  }
}

// Singleton instance
export const circuitBreakerService = new CircuitBreakerService();