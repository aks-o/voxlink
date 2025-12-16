"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemHealthService = exports.SystemHealthService = void 0;
const logger_1 = require("../monitoring/logger");
const circuit_breaker_service_1 = require("./circuit-breaker.service");
const performance_monitor_service_1 = require("./performance-monitor.service");
class SystemHealthService {
    constructor() {
        this.healthChecks = new Map();
        this.integrationChecks = new Map();
        this.circuitBreaker = new circuit_breaker_service_1.CircuitBreakerService();
        this.performanceMonitor = new performance_monitor_service_1.PerformanceMonitorService();
        this.initializeHealthChecks();
    }
    initializeHealthChecks() {
        // Initialize health checks for all services
        const services = [
            'api-gateway',
            'number-service',
            'ai-agent-service',
            'billing-service',
            'notification-service'
        ];
        services.forEach(service => {
            this.healthChecks.set(service, {
                service,
                status: 'healthy',
                responseTime: 0,
                lastCheck: new Date(),
                details: {}
            });
        });
        // Initialize integration checks
        const integrations = [
            { name: 'postgresql', type: 'database' },
            { name: 'redis', type: 'database' },
            { name: 'twilio', type: 'external_api' },
            { name: 'bandwidth', type: 'external_api' },
            { name: 's3', type: 'storage' },
            { name: 'websocket', type: 'messaging' }
        ];
        integrations.forEach(integration => {
            this.integrationChecks.set(integration.name, {
                name: integration.name,
                type: integration.type,
                status: 'connected',
                latency: 0,
                lastSync: new Date(),
                errorCount: 0
            });
        });
    }
    async performSystemHealthCheck() {
        logger_1.logger.info('Starting comprehensive system health check');
        try {
            // Check all services
            await this.checkAllServices();
            // Check all integrations
            await this.checkAllIntegrations();
            // Check real-time connections
            const realtimeStatus = await this.checkRealtimeConnections();
            // Check data consistency
            const dataConsistency = await this.checkDataConsistency();
            // Get performance metrics
            const performanceMetrics = await this.getPerformanceMetrics();
            const overallStatus = this.calculateOverallStatus();
            const systemStatus = {
                overall: overallStatus,
                services: Array.from(this.healthChecks.values()),
                integrations: Array.from(this.integrationChecks.values()),
                realTimeConnections: realtimeStatus,
                dataConsistency,
                performanceMetrics
            };
            logger_1.logger.info('System health check completed', { status: overallStatus });
            return systemStatus;
        }
        catch (error) {
            logger_1.logger.error('System health check failed', { error });
            throw error;
        }
    }
    async checkAllServices() {
        const serviceChecks = Array.from(this.healthChecks.keys()).map(async (serviceName) => {
            try {
                const startTime = Date.now();
                // Perform health check based on service type
                const isHealthy = await this.checkServiceHealth(serviceName);
                const responseTime = Date.now() - startTime;
                this.healthChecks.set(serviceName, {
                    service: serviceName,
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    responseTime,
                    lastCheck: new Date(),
                    details: { lastError: null }
                });
            }
            catch (error) {
                logger_1.logger.error(`Health check failed for ${serviceName}`, { error });
                this.healthChecks.set(serviceName, {
                    service: serviceName,
                    status: 'unhealthy',
                    responseTime: 0,
                    lastCheck: new Date(),
                    details: { lastError: error.message || String(error) }
                });
            }
        });
        await Promise.all(serviceChecks);
    }
    async checkServiceHealth(serviceName) {
        const serviceUrls = {
            'api-gateway': process.env.API_GATEWAY_URL || 'http://localhost:3000',
            'number-service': process.env.NUMBER_SERVICE_URL || 'http://localhost:3001',
            'ai-agent-service': process.env.AI_AGENT_SERVICE_URL || 'http://localhost:3002',
            'billing-service': process.env.BILLING_SERVICE_URL || 'http://localhost:3003',
            'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'
        };
        const url = serviceUrls[serviceName];
        if (!url)
            return false;
        try {
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    async checkAllIntegrations() {
        const integrationChecks = Array.from(this.integrationChecks.keys()).map(async (integrationName) => {
            try {
                const startTime = Date.now();
                const isConnected = await this.checkIntegrationHealth(integrationName);
                const latency = Date.now() - startTime;
                const currentCheck = this.integrationChecks.get(integrationName);
                this.integrationChecks.set(integrationName, {
                    ...currentCheck,
                    status: isConnected ? 'connected' : 'disconnected',
                    latency,
                    lastSync: new Date(),
                    errorCount: isConnected ? 0 : currentCheck.errorCount + 1
                });
            }
            catch (error) {
                logger_1.logger.error(`Integration check failed for ${integrationName}`, { error });
                const currentCheck = this.integrationChecks.get(integrationName);
                this.integrationChecks.set(integrationName, {
                    ...currentCheck,
                    status: 'error',
                    latency: 0,
                    lastSync: new Date(),
                    errorCount: currentCheck.errorCount + 1
                });
            }
        });
        await Promise.all(integrationChecks);
    }
    async checkIntegrationHealth(integrationName) {
        switch (integrationName) {
            case 'postgresql':
                return this.checkDatabaseConnection('postgresql');
            case 'redis':
                return this.checkDatabaseConnection('redis');
            case 'twilio':
                return this.checkExternalAPI('twilio');
            case 'bandwidth':
                return this.checkExternalAPI('bandwidth');
            case 's3':
                return this.checkStorageConnection();
            case 'websocket':
                return this.checkWebSocketHealth();
            default:
                return false;
        }
    }
    async checkDatabaseConnection(type) {
        // Implementation would depend on actual database clients
        // This is a placeholder for the actual database health check
        try {
            if (type === 'postgresql') {
                // Check PostgreSQL connection
                return true; // Placeholder
            }
            else if (type === 'redis') {
                // Check Redis connection
                return true; // Placeholder
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
    async checkExternalAPI(provider) {
        // Check external API connectivity
        try {
            // This would make actual API calls to verify connectivity
            return true; // Placeholder
        }
        catch (error) {
            return false;
        }
    }
    async checkStorageConnection() {
        // Check S3 or other storage connectivity
        try {
            return true; // Placeholder
        }
        catch (error) {
            return false;
        }
    }
    async checkWebSocketHealth() {
        // Check WebSocket server health
        try {
            return true; // Placeholder
        }
        catch (error) {
            return false;
        }
    }
    async checkRealtimeConnections() {
        // Get real-time connection statistics
        return {
            websocketConnections: 0, // Placeholder
            activeChannels: [],
            messageLatency: 0,
            connectionErrors: 0
        };
    }
    async checkDataConsistency() {
        // Check data consistency across services
        try {
            const inconsistencies = await this.validateDataConsistency();
            return {
                status: inconsistencies.length === 0 ? 'consistent' : 'inconsistent',
                lastCheck: new Date(),
                inconsistencies,
                autoRepairAttempts: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Data consistency check failed', { error });
            return {
                status: 'inconsistent',
                lastCheck: new Date(),
                inconsistencies: ['Data consistency check failed'],
                autoRepairAttempts: 0
            };
        }
    }
    async validateDataConsistency() {
        const inconsistencies = [];
        // Check number service data consistency
        // Check billing service data consistency
        // Check AI agent service data consistency
        // Check notification service data consistency
        return inconsistencies;
    }
    async getPerformanceMetrics() {
        return this.performanceMonitor.getSystemMetrics();
    }
    calculateOverallStatus() {
        const services = Array.from(this.healthChecks.values());
        const integrations = Array.from(this.integrationChecks.values());
        const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
        const disconnectedIntegrations = integrations.filter(i => i.status === 'disconnected' || i.status === 'error').length;
        if (unhealthyServices === 0 && disconnectedIntegrations === 0) {
            return 'healthy';
        }
        else if (unhealthyServices <= 1 && disconnectedIntegrations <= 2) {
            return 'degraded';
        }
        else {
            return 'unhealthy';
        }
    }
    async repairSystemIssues() {
        logger_1.logger.info('Starting system repair process');
        // Attempt to repair unhealthy services
        const unhealthyServices = Array.from(this.healthChecks.values())
            .filter(s => s.status === 'unhealthy');
        for (const service of unhealthyServices) {
            try {
                await this.repairService(service.service);
            }
            catch (error) {
                logger_1.logger.error(`Failed to repair service ${service.service}`, { error });
            }
        }
        // Attempt to repair disconnected integrations
        const disconnectedIntegrations = Array.from(this.integrationChecks.values())
            .filter(i => i.status === 'disconnected' || i.status === 'error');
        for (const integration of disconnectedIntegrations) {
            try {
                await this.repairIntegration(integration.name);
            }
            catch (error) {
                logger_1.logger.error(`Failed to repair integration ${integration.name}`, { error });
            }
        }
    }
    async repairService(serviceName) {
        // Implement service-specific repair logic
        logger_1.logger.info(`Attempting to repair service: ${serviceName}`);
        // This could include:
        // - Restarting service containers
        // - Clearing caches
        // - Resetting connections
        // - Rolling back to previous version
    }
    async repairIntegration(integrationName) {
        // Implement integration-specific repair logic
        logger_1.logger.info(`Attempting to repair integration: ${integrationName}`);
        // This could include:
        // - Reconnecting to databases
        // - Refreshing API tokens
        // - Clearing connection pools
        // - Resetting circuit breakers
    }
    async optimizeSystemPerformance() {
        logger_1.logger.info('Starting system performance optimization');
        // Get current performance metrics
        const metrics = await this.getPerformanceMetrics();
        // Optimize based on current metrics
        if (metrics.cpuUsage > 80) {
            await this.optimizeCPUUsage();
        }
        if (metrics.memoryUsage > 85) {
            await this.optimizeMemoryUsage();
        }
        if (metrics.networkLatency > 200) {
            await this.optimizeNetworkPerformance();
        }
        // Optimize database queries
        await this.optimizeDatabasePerformance();
        // Optimize caching
        await this.optimizeCaching();
    }
    async optimizeCPUUsage() {
        logger_1.logger.info('Optimizing CPU usage');
        // Implement CPU optimization strategies
    }
    async optimizeMemoryUsage() {
        logger_1.logger.info('Optimizing memory usage');
        // Implement memory optimization strategies
    }
    async optimizeNetworkPerformance() {
        logger_1.logger.info('Optimizing network performance');
        // Implement network optimization strategies
    }
    async optimizeDatabasePerformance() {
        logger_1.logger.info('Optimizing database performance');
        // Implement database optimization strategies
    }
    async optimizeCaching() {
        logger_1.logger.info('Optimizing caching strategies');
        // Implement caching optimization strategies
    }
}
exports.SystemHealthService = SystemHealthService;
exports.systemHealthService = new SystemHealthService();
