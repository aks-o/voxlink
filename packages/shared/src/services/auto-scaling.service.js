"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoScalingService = exports.AutoScalingService = void 0;
const events_1 = require("events");
const logger_1 = require("../monitoring/logger");
const performance_monitor_service_1 = require("./performance-monitor.service");
class AutoScalingService extends events_1.EventEmitter {
    constructor() {
        super();
        this.services = new Map();
        this.scalingRules = new Map();
        this.scalingActions = [];
        this.lastScalingAction = new Map();
        this.isMonitoring = false;
        this.setupDefaultRules();
    }
    /**
     * Start auto-scaling monitoring
     */
    startMonitoring(intervalMs = 30000) {
        if (this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.evaluateScalingRules();
        }, intervalMs);
        logger_1.logger.info('Auto-scaling monitoring started');
    }
    /**
     * Stop auto-scaling monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.isMonitoring = false;
        logger_1.logger.info('Auto-scaling monitoring stopped');
    }
    /**
     * Register a service for auto-scaling
     */
    registerService(serviceName, initialInstances = []) {
        this.services.set(serviceName, initialInstances);
        logger_1.logger.info(`Service registered for auto-scaling: ${serviceName}`);
    }
    /**
     * Add scaling rule for a service
     */
    addScalingRule(serviceName, rule) {
        if (!this.scalingRules.has(serviceName)) {
            this.scalingRules.set(serviceName, []);
        }
        this.scalingRules.get(serviceName).push(rule);
        logger_1.logger.info(`Scaling rule added for ${serviceName}: ${rule.name}`);
    }
    /**
     * Remove scaling rule
     */
    removeScalingRule(serviceName, ruleId) {
        const rules = this.scalingRules.get(serviceName);
        if (!rules) {
            return false;
        }
        const index = rules.findIndex(rule => rule.id === ruleId);
        if (index === -1) {
            return false;
        }
        rules.splice(index, 1);
        logger_1.logger.info(`Scaling rule removed for ${serviceName}: ${ruleId}`);
        return true;
    }
    /**
     * Update service instance metrics
     */
    updateInstanceMetrics(serviceName, instanceId, metrics) {
        const instances = this.services.get(serviceName);
        if (!instances) {
            return;
        }
        const instance = instances.find(inst => inst.id === instanceId);
        if (instance) {
            instance.metrics = metrics;
            instance.lastHealthCheck = new Date();
            instance.healthStatus = this.determineHealthStatus(metrics);
        }
    }
    /**
     * Get current instances for a service
     */
    getServiceInstances(serviceName) {
        return this.services.get(serviceName) || [];
    }
    /**
     * Get scaling rules for a service
     */
    getScalingRules(serviceName) {
        return this.scalingRules.get(serviceName) || [];
    }
    /**
     * Get recent scaling actions
     */
    getScalingActions(limit = 50) {
        return this.scalingActions
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Get scaling statistics
     */
    getScalingStats() {
        let totalInstances = 0;
        let healthyInstances = 0;
        let unhealthyInstances = 0;
        let totalResponseTime = 0;
        let totalCpuUsage = 0;
        let totalMemoryUsage = 0;
        for (const instances of this.services.values()) {
            totalInstances += instances.length;
            for (const instance of instances) {
                if (instance.healthStatus === 'healthy') {
                    healthyInstances++;
                }
                else if (instance.healthStatus === 'unhealthy') {
                    unhealthyInstances++;
                }
                totalResponseTime += instance.metrics.responseTime;
                totalCpuUsage += instance.metrics.cpu;
                totalMemoryUsage += instance.metrics.memory;
            }
        }
        const recentActions = this.scalingActions.filter(action => Date.now() - action.timestamp.getTime() < 3600000 // Last hour
        ).length;
        return {
            totalServices: this.services.size,
            totalInstances,
            healthyInstances,
            unhealthyInstances,
            recentScalingActions: recentActions,
            avgResponseTime: totalInstances > 0 ? totalResponseTime / totalInstances : 0,
            avgCpuUsage: totalInstances > 0 ? totalCpuUsage / totalInstances : 0,
            avgMemoryUsage: totalInstances > 0 ? totalMemoryUsage / totalInstances : 0,
        };
    }
    /**
     * Manually trigger scaling action
     */
    async manualScale(serviceName, action, amount = 1) {
        const instances = this.services.get(serviceName) || [];
        const currentCount = instances.length;
        let targetCount;
        if (action === 'scale_up') {
            targetCount = currentCount + amount;
        }
        else {
            targetCount = Math.max(1, currentCount - amount); // Ensure at least 1 instance
        }
        const scalingAction = {
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            rule: {
                id: 'manual',
                name: 'Manual Scaling',
                metric: 'cpu',
                operator: 'gt',
                threshold: 0,
                action,
                cooldownPeriod: 0,
                minInstances: 1,
                maxInstances: 100,
                scaleAmount: amount,
                enabled: true,
            },
            action,
            currentInstances: currentCount,
            targetInstances: targetCount,
            timestamp: new Date(),
            reason: 'Manual scaling triggered',
            status: 'pending',
        };
        this.scalingActions.push(scalingAction);
        await this.executeScalingAction(serviceName, scalingAction);
        return scalingAction;
    }
    /**
     * Evaluate all scaling rules for all services
     */
    async evaluateScalingRules() {
        for (const [serviceName, rules] of this.scalingRules.entries()) {
            const instances = this.services.get(serviceName) || [];
            if (instances.length === 0) {
                continue;
            }
            // Calculate aggregate metrics
            const aggregateMetrics = this.calculateAggregateMetrics(instances);
            // Evaluate each rule
            for (const rule of rules) {
                if (!rule.enabled) {
                    continue;
                }
                // Check cooldown period
                const lastAction = this.lastScalingAction.get(`${serviceName}_${rule.id}`);
                if (lastAction && Date.now() - lastAction.getTime() < rule.cooldownPeriod) {
                    continue;
                }
                // Evaluate rule condition
                if (this.evaluateRule(rule, aggregateMetrics)) {
                    await this.triggerScalingAction(serviceName, rule, instances.length, aggregateMetrics);
                }
            }
        }
    }
    /**
     * Calculate aggregate metrics from all instances
     */
    calculateAggregateMetrics(instances) {
        if (instances.length === 0) {
            return {
                cpu: 0,
                memory: 0,
                requestRate: 0,
                responseTime: 0,
                errorRate: 0,
                activeConnections: 0,
            };
        }
        const totals = instances.reduce((acc, instance) => ({
            cpu: acc.cpu + instance.metrics.cpu,
            memory: acc.memory + instance.metrics.memory,
            requestRate: acc.requestRate + instance.metrics.requestRate,
            responseTime: acc.responseTime + instance.metrics.responseTime,
            errorRate: acc.errorRate + instance.metrics.errorRate,
            activeConnections: acc.activeConnections + instance.metrics.activeConnections,
        }), { cpu: 0, memory: 0, requestRate: 0, responseTime: 0, errorRate: 0, activeConnections: 0 });
        return {
            cpu: totals.cpu / instances.length,
            memory: totals.memory / instances.length,
            requestRate: totals.requestRate,
            responseTime: totals.responseTime / instances.length,
            errorRate: totals.errorRate / instances.length,
            activeConnections: totals.activeConnections,
        };
    }
    /**
     * Evaluate if a scaling rule should trigger
     */
    evaluateRule(rule, metrics) {
        const metricValue = metrics[rule.metric];
        switch (rule.operator) {
            case 'gt': return metricValue > rule.threshold;
            case 'lt': return metricValue < rule.threshold;
            case 'gte': return metricValue >= rule.threshold;
            case 'lte': return metricValue <= rule.threshold;
            default: return false;
        }
    }
    /**
     * Trigger a scaling action
     */
    async triggerScalingAction(serviceName, rule, currentInstances, metrics) {
        let targetInstances;
        if (rule.action === 'scale_up') {
            targetInstances = Math.min(rule.maxInstances, currentInstances + rule.scaleAmount);
        }
        else {
            targetInstances = Math.max(rule.minInstances, currentInstances - rule.scaleAmount);
        }
        // Don't scale if target is same as current
        if (targetInstances === currentInstances) {
            return;
        }
        const scalingAction = {
            id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            rule,
            action: rule.action,
            currentInstances,
            targetInstances,
            timestamp: new Date(),
            reason: `${rule.metric} ${rule.operator} ${rule.threshold} (current: ${metrics[rule.metric]})`,
            status: 'pending',
        };
        this.scalingActions.push(scalingAction);
        this.lastScalingAction.set(`${serviceName}_${rule.id}`, new Date());
        await this.executeScalingAction(serviceName, scalingAction);
    }
    /**
     * Execute a scaling action
     */
    async executeScalingAction(serviceName, action) {
        try {
            action.status = 'in_progress';
            this.emit('scalingStarted', serviceName, action);
            // Simulate scaling operation (in real implementation, this would interact with container orchestrator)
            await this.performScaling(serviceName, action);
            action.status = 'completed';
            this.emit('scalingCompleted', serviceName, action);
            logger_1.logger.info(`Scaling action completed for ${serviceName}: ${action.currentInstances} -> ${action.targetInstances}`);
            // Report metrics
            performance_monitor_service_1.performanceMonitor.recordMetric('auto_scaling.action_completed', 1, 'count', { service: serviceName, action: action.action });
        }
        catch (error) {
            action.status = 'failed';
            action.error = error.message;
            this.emit('scalingFailed', serviceName, action, error);
            logger_1.logger.error(`Scaling action failed for ${serviceName}:`, error);
        }
    }
    /**
     * Perform the actual scaling operation
     */
    async performScaling(serviceName, action) {
        const instances = this.services.get(serviceName) || [];
        const currentCount = instances.length;
        const targetCount = action.targetInstances;
        if (targetCount > currentCount) {
            // Scale up - add instances
            const instancesToAdd = targetCount - currentCount;
            for (let i = 0; i < instancesToAdd; i++) {
                const newInstance = {
                    id: `${serviceName}_${Date.now()}_${i}`,
                    serviceName,
                    status: 'starting',
                    startTime: new Date(),
                    healthStatus: 'unknown',
                    metrics: {
                        cpu: 0,
                        memory: 0,
                        requestRate: 0,
                        responseTime: 0,
                        errorRate: 0,
                        activeConnections: 0,
                    },
                };
                instances.push(newInstance);
                // Simulate startup time
                setTimeout(() => {
                    newInstance.status = 'running';
                    newInstance.healthStatus = 'healthy';
                }, 5000);
            }
        }
        else if (targetCount < currentCount) {
            // Scale down - remove instances
            const instancesToRemove = currentCount - targetCount;
            const instancesToStop = instances.splice(-instancesToRemove, instancesToRemove);
            // Gracefully stop instances
            for (const instance of instancesToStop) {
                instance.status = 'stopping';
                setTimeout(() => {
                    instance.status = 'stopped';
                }, 2000);
            }
        }
        this.services.set(serviceName, instances);
    }
    /**
     * Determine health status based on metrics
     */
    determineHealthStatus(metrics) {
        if (metrics.cpu > 90 || metrics.memory > 90 || metrics.errorRate > 10) {
            return 'unhealthy';
        }
        if (metrics.responseTime > 5000) {
            return 'unhealthy';
        }
        return 'healthy';
    }
    /**
     * Setup default scaling rules
     */
    setupDefaultRules() {
        // These would be applied to services that don't have custom rules
        const defaultRules = [
            {
                id: 'cpu_scale_up',
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
            },
            {
                id: 'cpu_scale_down',
                name: 'CPU Scale Down',
                metric: 'cpu',
                operator: 'lt',
                threshold: 30,
                action: 'scale_down',
                cooldownPeriod: 600000, // 10 minutes
                minInstances: 1,
                maxInstances: 10,
                scaleAmount: 1,
                enabled: true,
            },
            {
                id: 'memory_scale_up',
                name: 'Memory Scale Up',
                metric: 'memory',
                operator: 'gt',
                threshold: 80,
                action: 'scale_up',
                cooldownPeriod: 300000, // 5 minutes
                minInstances: 1,
                maxInstances: 10,
                scaleAmount: 1,
                enabled: true,
            },
            {
                id: 'response_time_scale_up',
                name: 'Response Time Scale Up',
                metric: 'responseTime',
                operator: 'gt',
                threshold: 2000, // 2 seconds
                action: 'scale_up',
                cooldownPeriod: 180000, // 3 minutes
                minInstances: 1,
                maxInstances: 10,
                scaleAmount: 2, // Scale up by 2 for response time issues
                enabled: true,
            },
        ];
        // Store default rules for later use
        this.scalingRules.set('default', defaultRules);
    }
}
exports.AutoScalingService = AutoScalingService;
// Singleton instance
exports.autoScalingService = new AutoScalingService();
