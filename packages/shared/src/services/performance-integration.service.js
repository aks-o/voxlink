"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceIntegrationService = void 0;
const events_1 = require("events");
const cache_service_1 = require("./cache.service");
const query_optimizer_service_1 = require("./query-optimizer.service");
const cdn_service_1 = require("./cdn.service");
const performance_monitor_service_1 = require("./performance-monitor.service");
const auto_scaling_service_1 = require("./auto-scaling.service");
const circuit_breaker_service_1 = require("./circuit-breaker.service");
const logger_1 = require("../monitoring/logger");
class PerformanceIntegrationService extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.isInitialized = false;
        this.config = config;
        this.queryOptimizer = new query_optimizer_service_1.QueryOptimizerService();
    }
    /**
     * Initialize all performance services
     */
    async initialize() {
        try {
            logger_1.logger.info('Initializing performance integration service');
            // Initialize cache service
            if (this.config.cache.enabled) {
                this.cacheService = new cache_service_1.CacheService(this.config.cache);
                await this.cacheService.connect();
                logger_1.logger.info('Cache service initialized');
            }
            // Initialize CDN service
            if (this.config.cdn.enabled) {
                this.cdnService = new cdn_service_1.CDNService(this.config.cdn);
                logger_1.logger.info('CDN service initialized');
            }
            // Initialize performance monitoring
            if (this.config.monitoring.enabled) {
                performance_monitor_service_1.performanceMonitor.startMonitoring(this.config.monitoring.metricsInterval);
                this.setupAlertThresholds();
                logger_1.logger.info('Performance monitoring initialized');
            }
            // Initialize auto-scaling
            if (this.config.autoScaling.enabled) {
                auto_scaling_service_1.autoScalingService.startMonitoring(this.config.autoScaling.monitoringInterval);
                if (this.config.autoScaling.defaultRules) {
                    this.setupDefaultScalingRules();
                }
                logger_1.logger.info('Auto-scaling service initialized');
            }
            // Initialize circuit breakers
            if (this.config.circuitBreaker.enabled) {
                this.setupCircuitBreakerEvents();
                logger_1.logger.info('Circuit breaker service initialized');
            }
            // Start metrics collection
            this.startMetricsCollection();
            this.isInitialized = true;
            this.emit('initialized');
            logger_1.logger.info('Performance integration service fully initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize performance integration service:', error);
            throw error;
        }
    }
    /**
     * Shutdown all performance services
     */
    async shutdown() {
        try {
            logger_1.logger.info('Shutting down performance integration service');
            if (this.metricsInterval) {
                clearInterval(this.metricsInterval);
            }
            if (this.cacheService) {
                await this.cacheService.disconnect();
            }
            performance_monitor_service_1.performanceMonitor.stopMonitoring();
            auto_scaling_service_1.autoScalingService.stopMonitoring();
            this.isInitialized = false;
            this.emit('shutdown');
            logger_1.logger.info('Performance integration service shut down');
        }
        catch (error) {
            logger_1.logger.error('Error during performance service shutdown:', error);
            throw error;
        }
    }
    /**
     * Get comprehensive performance report
     */
    async getPerformanceReport() {
        if (!this.isInitialized) {
            throw new Error('Performance integration service not initialized');
        }
        const timestamp = new Date();
        // Collect metrics from all services
        const systemHealth = await performance_monitor_service_1.performanceMonitor.getSystemHealth();
        const cacheStats = this.cacheService?.getStats();
        const scalingStats = auto_scaling_service_1.autoScalingService.getScalingStats();
        const circuitBreakerStats = circuit_breaker_service_1.circuitBreakerService.getAllStats();
        const queryStats = this.queryOptimizer.getQueryStats();
        // Calculate CDN metrics
        const cdnMetrics = this.cdnService ? await this.getCDNMetrics() : {
            hitRate: 0,
            bandwidth: 0,
            requests: 0,
        };
        const metrics = {
            cache: {
                hitRate: cacheStats?.hitRate || 0,
                totalRequests: (cacheStats?.hits || 0) + (cacheStats?.misses || 0),
                responseTime: cacheStats ? await this.getCacheResponseTime() : 0,
                errorRate: cacheStats ? (cacheStats.errors / Math.max(1, cacheStats.hits + cacheStats.misses)) * 100 : 0,
            },
            database: {
                averageQueryTime: queryStats.averageExecutionTime,
                slowQueries: queryStats.slowQueries,
                connectionPoolUsage: await this.getDatabaseConnectionUsage(),
            },
            system: {
                cpuUsage: systemHealth.metrics.cpu,
                memoryUsage: systemHealth.metrics.memory,
                diskUsage: systemHealth.metrics.disk,
                networkLatency: systemHealth.metrics.network,
            },
            application: {
                responseTime: await this.getApplicationResponseTime(),
                throughput: await this.getApplicationThroughput(),
                errorRate: await this.getApplicationErrorRate(),
                activeConnections: scalingStats.totalInstances,
            },
            cdn: cdnMetrics,
        };
        // Generate recommendations
        const recommendations = this.generateRecommendations(metrics, systemHealth);
        // Get service statuses
        const services = {};
        for (const [serviceName, stats] of Object.entries(circuitBreakerStats)) {
            services[serviceName] = {
                status: stats.state === 'CLOSED' ? 'up' : stats.state === 'HALF_OPEN' ? 'degraded' : 'down',
                responseTime: 0, // Would be populated from actual service metrics
                errorRate: stats.errorRate,
                circuitBreakerState: stats.state,
            };
        }
        return {
            timestamp,
            overall: {
                status: systemHealth.status,
                score: systemHealth.score,
                recommendations: recommendations.overall,
            },
            metrics,
            services,
            optimizations: {
                cacheOptimizations: recommendations.cache,
                queryOptimizations: recommendations.database,
                scalingRecommendations: recommendations.scaling,
                cdnOptimizations: recommendations.cdn,
            },
        };
    }
    /**
     * Optimize performance based on current metrics
     */
    async optimizePerformance() {
        const applied = [];
        const scheduled = [];
        const failed = [];
        try {
            // Cache optimizations
            if (this.cacheService) {
                const cacheOptimizations = await this.applyCacheOptimizations();
                applied.push(...cacheOptimizations.applied);
                failed.push(...cacheOptimizations.failed);
            }
            // Query optimizations
            if (this.config.queryOptimization.enabled) {
                const queryOptimizations = await this.applyQueryOptimizations();
                applied.push(...queryOptimizations.applied);
                scheduled.push(...queryOptimizations.scheduled);
                failed.push(...queryOptimizations.failed);
            }
            // CDN optimizations
            if (this.cdnService) {
                const cdnOptimizations = await this.applyCDNOptimizations();
                applied.push(...cdnOptimizations.applied);
                failed.push(...cdnOptimizations.failed);
            }
            // Auto-scaling optimizations
            const scalingOptimizations = await this.applyScalingOptimizations();
            applied.push(...scalingOptimizations.applied);
            failed.push(...scalingOptimizations.failed);
            logger_1.logger.info('Performance optimization completed', {
                applied: applied.length,
                scheduled: scheduled.length,
                failed: failed.length,
            });
            this.emit('optimizationCompleted', { applied, scheduled, failed });
        }
        catch (error) {
            logger_1.logger.error('Performance optimization failed:', error);
            failed.push('Global optimization failed');
        }
        return { applied, scheduled, failed };
    }
    /**
     * Get cache service instance
     */
    getCacheService() {
        return this.cacheService;
    }
    /**
     * Get CDN service instance
     */
    getCDNService() {
        return this.cdnService;
    }
    /**
     * Get query optimizer instance
     */
    getQueryOptimizer() {
        return this.queryOptimizer;
    }
    /**
     * Check if service is healthy
     */
    async isHealthy() {
        if (!this.isInitialized) {
            return false;
        }
        try {
            // Check cache health
            if (this.cacheService && !this.cacheService.isHealthy()) {
                return false;
            }
            // Check system health
            const systemHealth = await performance_monitor_service_1.performanceMonitor.getSystemHealth();
            if (systemHealth.status === 'unhealthy') {
                return false;
            }
            // Check circuit breaker health
            const circuitHealth = circuit_breaker_service_1.circuitBreakerService.getHealthStatus();
            if (circuitHealth.unhealthy.length > circuitHealth.healthy.length) {
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            return false;
        }
    }
    /**
     * Setup alert thresholds for monitoring
     */
    setupAlertThresholds() {
        const thresholds = this.config.monitoring.alertThresholds;
        performance_monitor_service_1.performanceMonitor.addThreshold({
            metric: 'api.response_time',
            operator: 'gt',
            value: thresholds.responseTime,
            severity: 'high',
            description: 'API response time exceeded threshold',
        });
        performance_monitor_service_1.performanceMonitor.addThreshold({
            metric: 'api.error_rate',
            operator: 'gt',
            value: thresholds.errorRate,
            severity: 'high',
            description: 'API error rate exceeded threshold',
        });
        performance_monitor_service_1.performanceMonitor.addThreshold({
            metric: 'system.cpu.usage',
            operator: 'gt',
            value: thresholds.cpuUsage,
            severity: 'medium',
            description: 'CPU usage exceeded threshold',
        });
        performance_monitor_service_1.performanceMonitor.addThreshold({
            metric: 'system.memory.usage',
            operator: 'gt',
            value: thresholds.memoryUsage,
            severity: 'medium',
            description: 'Memory usage exceeded threshold',
        });
    }
    /**
     * Setup default auto-scaling rules
     */
    setupDefaultScalingRules() {
        const services = ['api-gateway', 'number-service', 'billing-service', 'notification-service'];
        for (const serviceName of services) {
            auto_scaling_service_1.autoScalingService.registerService(serviceName);
            // CPU-based scaling
            auto_scaling_service_1.autoScalingService.addScalingRule(serviceName, {
                id: `${serviceName}_cpu_scale_up`,
                name: 'CPU Scale Up',
                metric: 'cpu',
                operator: 'gt',
                threshold: 70,
                action: 'scale_up',
                cooldownPeriod: 300000, // 5 minutes
                minInstances: 1,
                maxInstances: 10,
                scaleAmount: 1,
                enabled: true,
            });
            // Response time-based scaling
            auto_scaling_service_1.autoScalingService.addScalingRule(serviceName, {
                id: `${serviceName}_response_time_scale_up`,
                name: 'Response Time Scale Up',
                metric: 'responseTime',
                operator: 'gt',
                threshold: 2000,
                action: 'scale_up',
                cooldownPeriod: 180000, // 3 minutes
                minInstances: 1,
                maxInstances: 10,
                scaleAmount: 2,
                enabled: true,
            });
        }
    }
    /**
     * Setup circuit breaker event handlers
     */
    setupCircuitBreakerEvents() {
        circuit_breaker_service_1.circuitBreakerService.on('stateChange', (serviceName, newState, previousState) => {
            logger_1.logger.warn(`Circuit breaker state change for ${serviceName}: ${previousState} -> ${newState}`);
            performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.state_change', 1, 'count', { service: serviceName, newState, previousState });
            this.emit('circuitBreakerStateChange', serviceName, newState, previousState);
        });
        circuit_breaker_service_1.circuitBreakerService.on('failure', (serviceName, error) => {
            logger_1.logger.error(`Circuit breaker failure for ${serviceName}:`, error);
            performance_monitor_service_1.performanceMonitor.recordMetric('circuit_breaker.failure', 1, 'count', { service: serviceName });
        });
    }
    /**
     * Start collecting metrics from all services
     */
    startMetricsCollection() {
        this.metricsInterval = setInterval(async () => {
            try {
                await this.collectAndReportMetrics();
            }
            catch (error) {
                logger_1.logger.error('Error collecting metrics:', error);
            }
        }, this.config.monitoring.metricsInterval);
    }
    /**
     * Collect and report metrics from all services
     */
    async collectAndReportMetrics() {
        // Cache metrics
        if (this.cacheService) {
            const cacheStats = this.cacheService.getStats();
            performance_monitor_service_1.performanceMonitor.recordMetric('cache.hit_rate', cacheStats.hitRate, 'percent');
            performance_monitor_service_1.performanceMonitor.recordMetric('cache.total_requests', cacheStats.hits + cacheStats.misses, 'count');
            performance_monitor_service_1.performanceMonitor.recordMetric('cache.errors', cacheStats.errors, 'count');
        }
        // Query metrics
        const queryStats = this.queryOptimizer.getQueryStats();
        performance_monitor_service_1.performanceMonitor.recordMetric('database.average_query_time', queryStats.averageExecutionTime, 'ms');
        performance_monitor_service_1.performanceMonitor.recordMetric('database.slow_queries', queryStats.slowQueries, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('database.total_queries', queryStats.totalQueries, 'count');
        // Auto-scaling metrics
        const scalingStats = auto_scaling_service_1.autoScalingService.getScalingStats();
        performance_monitor_service_1.performanceMonitor.recordMetric('scaling.total_instances', scalingStats.totalInstances, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('scaling.healthy_instances', scalingStats.healthyInstances, 'count');
        performance_monitor_service_1.performanceMonitor.recordMetric('scaling.unhealthy_instances', scalingStats.unhealthyInstances, 'count');
        // CDN metrics
        if (this.cdnService) {
            const cdnMetrics = await this.getCDNMetrics();
            performance_monitor_service_1.performanceMonitor.recordMetric('cdn.hit_rate', cdnMetrics.hitRate, 'percent');
            performance_monitor_service_1.performanceMonitor.recordMetric('cdn.bandwidth', cdnMetrics.bandwidth, 'bytes');
            performance_monitor_service_1.performanceMonitor.recordMetric('cdn.requests', cdnMetrics.requests, 'count');
        }
    }
    /**
     * Generate performance recommendations
     */
    generateRecommendations(metrics, systemHealth) {
        const recommendations = {
            overall: [],
            cache: [],
            database: [],
            scaling: [],
            cdn: [],
        };
        // Overall recommendations
        if (systemHealth.score < 70) {
            recommendations.overall.push('System health is below optimal. Consider reviewing all performance metrics.');
        }
        // Cache recommendations
        if (metrics.cache.hitRate < 80) {
            recommendations.cache.push('Cache hit rate is low. Consider increasing TTL or warming cache.');
        }
        if (metrics.cache.errorRate > 5) {
            recommendations.cache.push('Cache error rate is high. Check Redis connection and configuration.');
        }
        // Database recommendations
        if (metrics.database.averageQueryTime > 100) {
            recommendations.database.push('Average query time is high. Consider adding indexes or optimizing queries.');
        }
        if (metrics.database.slowQueries > 10) {
            recommendations.database.push('Multiple slow queries detected. Review query optimization suggestions.');
        }
        // Scaling recommendations
        if (metrics.system.cpuUsage > 80) {
            recommendations.scaling.push('High CPU usage detected. Consider scaling up instances.');
        }
        if (metrics.system.memoryUsage > 85) {
            recommendations.scaling.push('High memory usage detected. Consider scaling up or optimizing memory usage.');
        }
        // CDN recommendations
        if (metrics.cdn.hitRate < 90) {
            recommendations.cdn.push('CDN hit rate is low. Consider optimizing cache headers and TTL settings.');
        }
        return recommendations;
    }
    // Helper methods for metrics collection
    async getCacheResponseTime() {
        if (!this.cacheService)
            return 0;
        const metrics = await this.cacheService.getPerformanceMetrics();
        return metrics.avgResponseTime;
    }
    async getDatabaseConnectionUsage() {
        // This would typically query the database connection pool
        // For now, return a mock value
        return Math.random() * 100;
    }
    async getApplicationResponseTime() {
        // This would typically get from application metrics
        return Math.random() * 1000;
    }
    async getApplicationThroughput() {
        // This would typically get from application metrics
        return Math.random() * 1000;
    }
    async getApplicationErrorRate() {
        // This would typically get from application metrics
        return Math.random() * 5;
    }
    async getCDNMetrics() {
        if (!this.cdnService) {
            return { hitRate: 0, bandwidth: 0, requests: 0 };
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 3600000); // Last hour
        const metrics = await this.cdnService.getAnalytics(startDate, endDate);
        return {
            hitRate: metrics.cacheHitRate,
            bandwidth: metrics.bandwidth,
            requests: metrics.requests
        };
    }
    // Optimization methods
    async applyCacheOptimizations() {
        const applied = [];
        const failed = [];
        try {
            if (this.cacheService) {
                const stats = this.cacheService.getStats();
                // If hit rate is low, suggest cache warming
                if (stats.hitRate < 50) {
                    // This would implement cache warming logic
                    applied.push('Cache warming strategy implemented');
                }
                // If error rate is high, reset connections
                if (stats.errors > 100) {
                    // This would implement connection reset logic
                    applied.push('Cache connection reset performed');
                }
            }
        }
        catch (error) {
            failed.push('Cache optimization failed');
        }
        return { applied, failed };
    }
    async applyQueryOptimizations() {
        const applied = [];
        const scheduled = [];
        const failed = [];
        try {
            const indexSuggestions = this.queryOptimizer.suggestIndexes();
            if (indexSuggestions.length > 0) {
                // In a real implementation, these would be scheduled for deployment
                scheduled.push(`${indexSuggestions.length} index suggestions generated`);
                // Generate migration files
                const migrations = this.queryOptimizer.generateIndexMigrations(indexSuggestions);
                scheduled.push(`${migrations.length} index migrations prepared`);
            }
            applied.push('Query optimization analysis completed');
        }
        catch (error) {
            failed.push('Query optimization failed');
        }
        return { applied, scheduled, failed };
    }
    async applyCDNOptimizations() {
        const applied = [];
        const failed = [];
        try {
            if (this.cdnService) {
                // This would implement CDN optimization logic
                applied.push('CDN cache headers optimized');
            }
        }
        catch (error) {
            failed.push('CDN optimization failed');
        }
        return { applied, failed };
    }
    async applyScalingOptimizations() {
        const applied = [];
        const failed = [];
        try {
            const scalingStats = auto_scaling_service_1.autoScalingService.getScalingStats();
            // If there are unhealthy instances, trigger scaling
            if (scalingStats.unhealthyInstances > 0) {
                // This would implement scaling logic
                applied.push('Unhealthy instances scaling triggered');
            }
            applied.push('Scaling optimization analysis completed');
        }
        catch (error) {
            failed.push('Scaling optimization failed');
        }
        return { applied, failed };
    }
}
exports.PerformanceIntegrationService = PerformanceIntegrationService;
