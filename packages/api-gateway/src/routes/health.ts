import { Router } from 'express';
import { HealthCheckManager, commonHealthChecks, MetricsCollector } from '@voxlink/shared';
import { config } from '../config/config';

export const healthRouter = Router();

// Create health check manager for API Gateway
const healthManager = new HealthCheckManager('api-gateway');
const metrics = new MetricsCollector('api-gateway');

// Register health checks
healthManager.register('memory', commonHealthChecks.memory(512)); // 512MB limit

// Register external service checks based on configuration
for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
  healthManager.register(serviceName, 
    commonHealthChecks.externalService(serviceName, serviceConfig.url)
  );
}

// Health check endpoints
healthRouter.get('/', healthManager.healthEndpoint());
healthRouter.get('/detailed', healthManager.healthEndpoint());
healthRouter.get('/ready', healthManager.readinessEndpoint(['memory']));
healthRouter.get('/live', healthManager.livenessEndpoint());

// Metrics endpoint (Prometheus format)
healthRouter.get('/metrics', (req, res) => {
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
voxlink_gateway_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${config.nodeEnv}"} 1

${Object.entries(customMetrics).map(([key, value]) => 
  `# Custom metric: ${key}\n${key} ${Array.isArray(value) ? value[value.length - 1] : value}`
).join('\n')}
`.trim();

  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});