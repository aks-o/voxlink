# VoxLink Monitoring System

This directory contains the comprehensive monitoring and error handling infrastructure for the VoxLink virtual phone number management system.

## Components

### Error Handler (`error-handler.ts`)
- Centralized error handling with structured logging
- Custom error classes for different scenarios
- Request sanitization for security
- Global error handlers for uncaught exceptions
- Development vs production error responses

### Logger (`logger.ts`)
- Structured logging with Winston
- Multiple transport options (console, file)
- Performance monitoring utilities
- Business metrics tracking
- Security event logging
- Request/response logging middleware

### Health Check (`health-check.ts`)
- Comprehensive health check system
- Common health check implementations
- Kubernetes-ready endpoints (liveness, readiness)
- Metrics collection for Prometheus
- Service dependency monitoring

### Dashboard Configuration (`dashboard-config.ts`)
- Monitoring configuration for all services
- Metric definitions and thresholds
- Alert configurations
- Health check specifications

## Usage

### Basic Setup

```typescript
import { 
  createLogger, 
  errorHandler, 
  setupGlobalErrorHandlers,
  HealthCheckManager,
  commonHealthChecks 
} from '@voxlink/shared';

// Create service logger
const logger = createLogger('my-service');

// Setup global error handlers
setupGlobalErrorHandlers('my-service');

// Create health check manager
const healthManager = new HealthCheckManager('my-service');
healthManager.register('memory', commonHealthChecks.memory(512));

// Use in Express app
app.use(errorHandler('my-service'));
app.use('/health', healthManager.healthEndpoint());
```

### Error Handling

```typescript
import { createError, ValidationError, NotFoundError } from '@voxlink/shared';

// Using error factory
throw createError.validation('Invalid input data', { field: 'email' });

// Using error classes
throw new NotFoundError('User', userId);

// Custom errors
throw createError.custom('Custom error', 422, 'CUSTOM_ERROR', { details });
```

### Logging

```typescript
import { logger, measurePerformance } from '@voxlink/shared';

// Basic logging
logger.info('Operation completed', { userId, operation: 'create' });
logger.error('Operation failed', { error: error.message });

// Performance monitoring
const result = await measurePerformance('database-query', async () => {
  return await database.query('SELECT * FROM users');
});

// Business metrics
logger.logBusinessMetric({
  metric: 'user_registrations',
  value: 1,
  tags: { source: 'web', plan: 'premium' }
});

// Security events
logger.logSecurityEvent({
  event: 'failed_login_attempt',
  severity: 'medium',
  userId: 'user123',
  ip: '192.168.1.1',
  details: { attempts: 3 }
});
```

### Health Checks

```typescript
import { HealthCheckManager, commonHealthChecks } from '@voxlink/shared';

const healthManager = new HealthCheckManager('my-service');

// Register common health checks
healthManager.register('memory', commonHealthChecks.memory(512));
healthManager.register('database', commonHealthChecks.database(testConnection));
healthManager.register('redis', commonHealthChecks.redis(pingRedis));

// Register custom health check
healthManager.register('custom', commonHealthChecks.custom('my-check', async () => {
  // Custom health check logic
  return { healthy: true, details: { status: 'ok' } };
}));

// Use in Express routes
app.get('/health', healthManager.healthEndpoint());
app.get('/health/live', healthManager.livenessEndpoint());
app.get('/health/ready', healthManager.readinessEndpoint(['database', 'redis']));
```

## Environment Variables

Configure monitoring behavior with these environment variables:

```bash
# Logging
LOG_LEVEL=info                    # debug, info, warn, error
LOG_FORMAT=json                   # json, simple
ENABLE_CONSOLE_LOGGING=true       # Enable console output
ENABLE_FILE_LOGGING=false         # Enable file logging
LOG_DIR=logs                      # Log file directory

# Health Checks
HEALTH_CHECK_TIMEOUT=10000        # Health check timeout in ms
HEALTH_CHECK_INTERVAL=30000       # Health check interval in ms

# Error Handling
NODE_ENV=production               # Affects error detail exposure
```

## Monitoring Dashboards

The system provides pre-configured monitoring dashboards for:

- **API Gateway**: Request metrics, rate limiting, proxy performance
- **Number Service**: Search/purchase metrics, database performance, telecom provider calls
- **Billing Service**: Invoice generation, payment processing, usage tracking
- **Notification Service**: Delivery metrics, queue monitoring, channel performance

## Alerting

Alerts are configured for:

- **High error rates** (>5% for critical services)
- **Slow response times** (>2s for API endpoints)
- **Service unavailability**
- **Resource exhaustion** (memory, disk, connections)
- **Business metric anomalies**

## Integration with External Systems

### Prometheus
Metrics are exposed in Prometheus format at `/health/metrics` endpoint.

### Grafana
Dashboard configurations are available in the `dashboard-config.ts` file.

### Alertmanager
Alert rules can be generated from the alert configurations.

### ELK Stack
Structured logs are compatible with Elasticsearch/Logstash/Kibana.

## Best Practices

1. **Always use structured logging** with consistent field names
2. **Include request IDs** for tracing across services
3. **Sanitize sensitive data** before logging
4. **Set appropriate log levels** for different environments
5. **Monitor business metrics** alongside technical metrics
6. **Use health checks** for all external dependencies
7. **Set up alerts** for critical system failures
8. **Regular monitoring review** to adjust thresholds and alerts

## Troubleshooting

### High Memory Usage
Check the memory health check and adjust logging levels or file rotation.

### Missing Logs
Verify environment variables and file permissions for log directories.

### Health Check Failures
Check service dependencies and network connectivity.

### Alert Fatigue
Review and adjust alert thresholds based on historical data.