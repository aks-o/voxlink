"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const shared_1 = require("@voxlink/shared");
const config_1 = require("../config/config");
exports.healthRouter = (0, express_1.Router)();
// Create health check manager for API Gateway
const healthManager = new shared_1.HealthCheckManager('api-gateway');
const metrics = new shared_1.MetricsCollector('api-gateway');
// Register health checks
healthManager.register('memory', shared_1.commonHealthChecks.memory(512)); // 512MB limit
// Register external service checks based on configuration
for (const [serviceName, serviceConfig] of Object.entries(config_1.config.services)) {
    healthManager.register(serviceName, shared_1.commonHealthChecks.externalService(serviceName, serviceConfig.url));
}
// Health check endpoints
exports.healthRouter.get('/', healthManager.healthEndpoint());
exports.healthRouter.get('/detailed', healthManager.healthEndpoint());
exports.healthRouter.get('/ready', healthManager.readinessEndpoint(['memory']));
exports.healthRouter.get('/live', healthManager.livenessEndpoint());
// Metrics endpoint (Prometheus format)
exports.healthRouter.get('/metrics', (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const customMetrics = metrics.getMetrics();
    const prometheusMetrics = `
# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss}
nodejs_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}
nodejs_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}
nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external}

# HELP nodejs_cpu_usage_seconds CPU usage in seconds
# TYPE nodejs_cpu_usage_seconds counter
nodejs_cpu_usage_seconds{type="user"} ${cpuUsage.user / 1000000}
nodejs_cpu_usage_seconds{type="system"} ${cpuUsage.system / 1000000}

# HELP nodejs_uptime_seconds Process uptime in seconds
# TYPE nodejs_uptime_seconds gauge
nodejs_uptime_seconds ${process.uptime()}

# HELP voxlink_gateway_info Gateway information
# TYPE voxlink_gateway_info gauge
voxlink_gateway_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${config_1.config.nodeEnv}"} 1

${Object.entries(customMetrics).map(([key, value]) => `# Custom metric: ${key}\n${key} ${Array.isArray(value) ? value[value.length - 1] : value}`).join('\n')}
`.trim();
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
});
