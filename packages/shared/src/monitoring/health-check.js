"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.MetricsCollector = exports.commonHealthChecks = exports.HealthCheckManager = void 0;
const logger_1 = require("./logger");
class HealthCheckManager {
    constructor(serviceName) {
        this.checks = new Map();
        this.serviceName = serviceName;
    }
    // Register a health check
    register(name, check) {
        this.checks.set(name, check);
        logger_1.logger.info(`Health check registered: ${name}`, { service: this.serviceName });
    }
    // Remove a health check
    unregister(name) {
        this.checks.delete(name);
        logger_1.logger.info(`Health check unregistered: ${name}`, { service: this.serviceName });
    }
    // Run all health checks
    async runChecks() {
        const results = [];
        for (const [name, check] of this.checks) {
            const startTime = Date.now();
            try {
                const result = await Promise.race([
                    check(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 10000)),
                ]);
                result.responseTime = Date.now() - startTime;
                results.push(result);
                logger_1.logger.logHealthCheck(name, result.status, result.details);
            }
            catch (error) {
                const responseTime = Date.now() - startTime;
                const result = {
                    name,
                    status: 'unhealthy',
                    responseTime,
                    error: error.message,
                };
                results.push(result);
                logger_1.logger.logHealthCheck(name, 'unhealthy', { error: error.message });
            }
        }
        return results;
    }
    // Get overall system health
    async getSystemHealth() {
        const startTime = Date.now();
        const checks = await this.runChecks();
        // Determine overall status
        const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
        const hasDegraded = checks.some(check => check.status === 'degraded');
        let overallStatus;
        if (hasUnhealthy) {
            overallStatus = 'unhealthy';
        }
        else if (hasDegraded) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'healthy';
        }
        const systemHealth = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks,
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                platform: process.platform,
                nodeVersion: process.version,
            },
        };
        const totalTime = Date.now() - startTime;
        logger_1.logger.info('System health check completed', {
            status: overallStatus,
            totalTime,
            checksCount: checks.length,
        });
        return systemHealth;
    }
    // Express middleware for health endpoint
    healthEndpoint() {
        return async (req, res) => {
            try {
                const health = await this.getSystemHealth();
                const statusCode = health.status === 'healthy' ? 200 : 503;
                res.status(statusCode).json(health);
            }
            catch (error) {
                logger_1.logger.error('Health check endpoint error', { error: error.message });
                res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: 'Health check failed',
                });
            }
        };
    }
    // Simple liveness check
    livenessEndpoint() {
        return (req, res) => {
            res.status(200).json({
                alive: true,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                service: this.serviceName,
            });
        };
    }
    // Readiness check (only critical dependencies)
    readinessEndpoint(criticalChecks = []) {
        return async (req, res) => {
            try {
                const allChecks = await this.runChecks();
                const criticalResults = criticalChecks.length > 0
                    ? allChecks.filter(check => criticalChecks.includes(check.name))
                    : allChecks;
                const isReady = criticalResults.every(check => check.status === 'healthy');
                res.status(isReady ? 200 : 503).json({
                    ready: isReady,
                    timestamp: new Date().toISOString(),
                    service: this.serviceName,
                    checks: criticalResults,
                });
            }
            catch (error) {
                logger_1.logger.error('Readiness check error', { error: error.message });
                res.status(503).json({
                    ready: false,
                    timestamp: new Date().toISOString(),
                    service: this.serviceName,
                    error: 'Readiness check failed',
                });
            }
        };
    }
}
exports.HealthCheckManager = HealthCheckManager;
// Common health checks
exports.commonHealthChecks = {
    // Database health check
    database: (connectionTest) => {
        return async () => {
            const startTime = Date.now();
            try {
                const isConnected = await connectionTest();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'database',
                    status: isConnected ? 'healthy' : 'unhealthy',
                    responseTime,
                    details: { connected: isConnected },
                };
            }
            catch (error) {
                return {
                    name: 'database',
                    status: 'unhealthy',
                    responseTime: Date.now() - startTime,
                    error: error.message,
                };
            }
        };
    },
    // Redis health check
    redis: (pingTest) => {
        return async () => {
            const startTime = Date.now();
            try {
                const isConnected = await pingTest();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'redis',
                    status: isConnected ? 'healthy' : 'unhealthy',
                    responseTime,
                    details: { connected: isConnected },
                };
            }
            catch (error) {
                return {
                    name: 'redis',
                    status: 'unhealthy',
                    responseTime: Date.now() - startTime,
                    error: error.message,
                };
            }
        };
    },
    // External service health check
    externalService: (serviceName, url) => {
        return async () => {
            const startTime = Date.now();
            try {
                const response = await fetch(`${url}/health`, {
                    method: 'GET',
                    headers: { 'User-Agent': 'VoxLink-HealthCheck/1.0' },
                    signal: AbortSignal.timeout(5000),
                });
                const responseTime = Date.now() - startTime;
                const isHealthy = response.ok;
                return {
                    name: serviceName,
                    status: isHealthy ? 'healthy' : 'degraded',
                    responseTime,
                    details: {
                        statusCode: response.status,
                        url,
                    },
                };
            }
            catch (error) {
                return {
                    name: serviceName,
                    status: 'unhealthy',
                    responseTime: Date.now() - startTime,
                    error: error.message,
                    details: { url },
                };
            }
        };
    },
    // Memory usage check
    memory: (maxMemoryMB = 512) => {
        return async () => {
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            const isHealthy = heapUsedMB < maxMemoryMB;
            return {
                name: 'memory',
                status: isHealthy ? 'healthy' : 'degraded',
                responseTime: 0,
                details: {
                    heapUsedMB: Math.round(heapUsedMB),
                    maxMemoryMB,
                    memoryUsage,
                },
            };
        };
    },
    // Disk space check
    diskSpace: (maxUsagePercent = 90) => {
        return async () => {
            try {
                // This is a simplified check - in production you'd use a proper disk space library
                const stats = await Promise.resolve().then(() => __importStar(require('fs'))).then(fs => fs.promises.stat('.'));
                return {
                    name: 'disk_space',
                    status: 'healthy', // Simplified - always healthy for now
                    responseTime: 0,
                    details: {
                        maxUsagePercent,
                        // In a real implementation, you'd calculate actual disk usage
                    },
                };
            }
            catch (error) {
                return {
                    name: 'disk_space',
                    status: 'unhealthy',
                    responseTime: 0,
                    error: error.message,
                };
            }
        };
    },
    // Custom health check
    custom: (name, checkFn) => {
        return async () => {
            const startTime = Date.now();
            try {
                const result = await checkFn();
                const responseTime = Date.now() - startTime;
                return {
                    name,
                    status: result.healthy ? 'healthy' : 'unhealthy',
                    responseTime,
                    details: result.details,
                };
            }
            catch (error) {
                return {
                    name,
                    status: 'unhealthy',
                    responseTime: Date.now() - startTime,
                    error: error.message,
                };
            }
        };
    },
};
// Metrics collection
class MetricsCollector {
    constructor(serviceName) {
        this.metrics = new Map();
        this.serviceName = serviceName;
    }
    // Increment a counter
    increment(metric, tags) {
        const key = this.getMetricKey(metric, tags);
        const current = this.metrics.get(key) || 0;
        this.metrics.set(key, current + 1);
        logger_1.logger.logBusinessMetric({
            metric,
            value: current + 1,
            tags,
        });
    }
    // Set a gauge value
    gauge(metric, value, tags) {
        const key = this.getMetricKey(metric, tags);
        this.metrics.set(key, value);
        logger_1.logger.logBusinessMetric({
            metric,
            value,
            tags,
        });
    }
    // Record a histogram value (timing, size, etc.)
    histogram(metric, value, tags) {
        const key = this.getMetricKey(metric, tags);
        const existing = this.metrics.get(key) || [];
        existing.push(value);
        this.metrics.set(key, existing);
        logger_1.logger.logBusinessMetric({
            metric,
            value,
            tags,
        });
    }
    // Get all metrics (for Prometheus export)
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    // Clear all metrics
    clear() {
        this.metrics.clear();
    }
    getMetricKey(metric, tags) {
        if (!tags) {
            return metric;
        }
        const tagString = Object.entries(tags)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
        return `${metric}{${tagString}}`;
    }
}
exports.MetricsCollector = MetricsCollector;
// Global metrics collector
exports.metrics = new MetricsCollector('voxlink-default');
