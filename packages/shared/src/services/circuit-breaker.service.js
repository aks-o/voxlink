"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerService = exports.CircuitBreakerInstance = exports.CircuitBreakerService = exports.CircuitState = void 0;
const events_1 = require("events");
const logger_1 = require("../monitoring/logger");
const performance_monitor_service_1 = require("./performance-monitor.service");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreakerService extends events_1.EventEmitter {
    constructor() {
        super();
        this.circuits = new Map();
        this.defaultConfig = {
            failureThreshold: 5,
            recoveryTimeout: 60000, // 1 minute
            monitoringPeriod: 60000, // 1 minute
            volumeThreshold: 10,
            errorThresholdPercentage: 50,
            halfOpenMaxCalls: 3,
        };
        this.startMetricsReporting();
    }
    /**
     * Create or get a circuit breaker for a service
     */
    getCircuit(serviceName, config) {
        if (!this.circuits.has(serviceName)) {
            const circuitConfig = { ...this.defaultConfig, ...config };
            const circuit = new CircuitBreakerInstance(serviceName, circuitConfig);
            // Forward events
            circuit.on('stateChange', (state, previousState) => {
                this.emit('stateChange', serviceName, state, previousState);
                logger_1.logger.info(`Circuit breaker ${serviceName} state changed: ${previousState} -> ${state}`);
            });
            circuit.on('failure', (error) => {
                this.emit('failure', serviceName, error);
            });
            circuit.on('success', () => {
                this.emit('success', serviceName);
            });
            this.circuits.set(serviceName, circuit);
        }
        return this.circuits.get(serviceName);
    }
    /**
     * Execute a function with circuit breaker protection
     */
    async execute(serviceName, fn, config) {
        const circuit = this.getCircuit(serviceName, config);
        return circuit.execute(fn);
    }
    /**
     * Get statistics for all circuits
     */
    getAllStats() {
        const stats = {};
        for (const [serviceName, circuit] of this.circuits.entries()) {
            stats[serviceName] = circuit.getStats();
        }
        return stats;
    }
    /**
     * Get statistics for a specific circuit
     */
    getStats(serviceName) {
        const circuit = this.circuits.get(serviceName);
        return circuit ? circuit.getStats() : null;
    }
    /**
     * Reset a circuit breaker
     */
    reset(serviceName) {
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
    forceOpen(serviceName) {
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
    forceClose(serviceName) {
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
    getHealthStatus() {
        const healthy = [];
        const degraded = [];
        const unhealthy = [];
        for (const [serviceName, circuit] of this.circuits.entries()) {
            const stats = circuit.getStats();
            if (stats.state === CircuitState.CLOSED && stats.errorRate < 10) {
                healthy.push(serviceName);
            }
            else if (stats.state === CircuitState.HALF_OPEN || stats.errorRate < 50) {
                degraded.push(serviceName);
            }
            else {
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
    startMetricsReporting() {
        setInterval(() => {
            this.reportMetrics();
        }, 30000); // Report every 30 seconds
    }
    /**
     * Report circuit breaker metrics
     */
    reportMetrics() {
        const healthStatus = this.getHealthStatus();
        performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.healthy_count', healthStatus.healthy.length, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.degraded_count', healthStatus.degraded.length, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.unhealthy_count', healthStatus.unhealthy.length, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.total_count', healthStatus.totalCircuits, 'count');
        // Report individual circuit metrics
        for (const [serviceName, circuit] of this.circuits.entries()) {
            const stats = circuit.getStats();
            performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.error_rate', stats.errorRate, 'percent', { service: serviceName });
            performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.total_requests', stats.totalRequests, 'count', { service: serviceName });
        }
    }
}
exports.CircuitBreakerService = CircuitBreakerService;
class CircuitBreakerInstance extends events_1.EventEmitter {
    constructor(serviceName, config) {
        super();
        this.serviceName = serviceName;
        this.config = config;
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.totalRequests = 0;
        this.halfOpenCallCount = 0;
        this.requestHistory = [];
    }
    /**
     * Execute a function with circuit breaker protection
     */
    async execute(fn) {
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.moveToHalfOpen();
            }
            else {
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
        }
        catch (error) {
            this.onFailure(error);
            throw error;
        }
    }
    /**
     * Get circuit breaker statistics
     */
    getStats() {
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
    reset() {
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
    forceOpen() {
        const previousState = this.state;
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
        this.emit('stateChange', this.state, previousState);
    }
    /**
     * Force the circuit breaker to close
     */
    forceClose() {
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
    onSuccess() {
        this.successCount++;
        this.lastSuccessTime = new Date();
        this.addToHistory(true);
        if (this.state === CircuitState.HALF_OPEN) {
            // If we've had enough successful calls in half-open state, close the circuit
            if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
                this.moveToClosed();
            }
        }
        else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on success
            this.failureCount = 0;
        }
        this.emit('success');
    }
    /**
     * Handle failed execution
     */
    onFailure(error) {
        this.failureCount++;
        this.lastFailureTime = new Date();
        this.addToHistory(false);
        if (this.state === CircuitState.HALF_OPEN) {
            // Any failure in half-open state should open the circuit
            this.moveToOpen();
        }
        else if (this.state === CircuitState.CLOSED) {
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
    shouldOpen() {
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
    shouldAttemptReset() {
        return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime.getTime() : false;
    }
    /**
     * Move circuit to closed state
     */
    moveToClosed() {
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
    moveToOpen() {
        const previousState = this.state;
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
        this.emit('stateChange', this.state, previousState);
    }
    /**
     * Move circuit to half-open state
     */
    moveToHalfOpen() {
        const previousState = this.state;
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCallCount = 0;
        this.emit('stateChange', this.state, previousState);
    }
    /**
     * Calculate current error rate
     */
    calculateErrorRate() {
        if (this.totalRequests === 0) {
            return 0;
        }
        // Calculate error rate from recent history
        const now = Date.now();
        const recentRequests = this.requestHistory.filter(req => now - req.timestamp <= this.config.monitoringPeriod);
        if (recentRequests.length === 0) {
            return 0;
        }
        const failures = recentRequests.filter(req => !req.success).length;
        return (failures / recentRequests.length) * 100;
    }
    /**
     * Add request result to history
     */
    addToHistory(success) {
        const now = Date.now();
        this.requestHistory.push({ timestamp: now, success });
        // Keep only recent history
        this.requestHistory = this.requestHistory.filter(req => now - req.timestamp <= this.config.monitoringPeriod);
        // Limit history size
        if (this.requestHistory.length > 1000) {
            this.requestHistory = this.requestHistory.slice(-1000);
        }
    }
}
exports.CircuitBreakerInstance = CircuitBreakerInstance;
// Singleton instance
exports.circuitBreakerService = new CircuitBreakerService();
