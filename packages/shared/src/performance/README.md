# VoxLink Performance Optimization System

This document describes the comprehensive performance optimization system implemented for the VoxLink platform. The system includes caching, query optimization, CDN integration, performance monitoring, auto-scaling, and circuit breaker patterns.

## Overview

The performance optimization system is designed to:

- **Improve Response Times**: Through intelligent caching and query optimization
- **Increase Throughput**: Via compression, CDN, and connection pooling
- **Ensure Reliability**: Using circuit breakers and auto-scaling
- **Monitor Performance**: With detailed metrics and alerting
- **Optimize Resources**: Through automated scaling and resource management

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Integration Service               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Cache     │  │    CDN      │  │ Monitoring  │  │ Scaling │ │
│  │  Service    │  │  Service    │  │   Service   │  │ Service │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Query     │  │  Circuit    │  │Performance  │              │
│  │ Optimizer   │  │  Breaker    │  │Middleware   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Cache Service

**Purpose**: Provides Redis-based caching with intelligent cache management.

**Features**:
- Multi-level caching (L1: Memory, L2: Redis)
- Tag-based cache invalidation
- Compression for large values
- Performance metrics and monitoring
- Automatic cache warming
- Hit rate optimization

**Usage**:
```typescript
import { cacheUtils } from '@voxlink/shared/performance';

// Cache a function result
const result = await cacheUtils.cached(
  'user:123:profile',
  () => fetchUserProfile(123),
  3600, // TTL in seconds
  ['user', 'profile'] // Tags for invalidation
);

// Warm cache with data
await cacheUtils.warm([
  { key: 'popular:numbers', value: popularNumbers, ttl: 7200 },
  { key: 'countries:list', value: countries, ttl: 86400 }
]);
```

### 2. Query Optimizer

**Purpose**: Analyzes database queries and suggests optimizations.

**Features**:
- Slow query detection and logging
- Index suggestion generation
- Query pattern analysis
- Performance metrics tracking
- Automatic migration generation

**Usage**:
```typescript
import { QueryOptimizerService } from '@voxlink/shared/services/query-optimizer.service';

const optimizer = new QueryOptimizerService();

// Record query metrics
optimizer.recordQueryMetrics({
  query: 'SELECT * FROM virtual_numbers WHERE country_code = ?',
  executionTime: 1500,
  rowsAffected: 100,
  timestamp: new Date()
});

// Get optimization suggestions
const suggestions = optimizer.suggestIndexes();
```

### 3. CDN Service

**Purpose**: Manages content delivery network integration for global performance.

**Features**:
- Multi-provider support (CloudFlare, AWS, Azure, GCP)
- Asset optimization and compression
- Cache invalidation management
- Image optimization and responsive variants
- Analytics and performance tracking

**Usage**:
```typescript
import { CDNService } from '@voxlink/shared/services/cdn.service';

const cdn = new CDNService({
  provider: 'cloudflare',
  baseUrl: 'https://cdn.voxlink.com',
  apiKey: process.env.CDN_API_KEY
});

// Upload and optimize asset
const metadata = await cdn.uploadAsset(
  'images/logo.png',
  imageBuffer,
  { compress: true, minify: false }
);
```

### 4. Performance Monitor

**Purpose**: Comprehensive system performance monitoring and alerting.

**Features**:
- Real-time metrics collection
- Threshold-based alerting
- System health scoring
- Performance trend analysis
- Custom metric recording

**Usage**:
```typescript
import { performanceUtils } from '@voxlink/shared/performance';

// Record custom metrics
performanceUtils.recordMetric('api.response_time', 250, 'ms', { endpoint: '/api/numbers' });

// Measure function execution
const result = await performanceUtils.measureAsync('database.query', async () => {
  return await db.query('SELECT * FROM users');
});
```

### 5. Auto-Scaling Service

**Purpose**: Automatically scales services based on performance metrics.

**Features**:
- CPU and memory-based scaling
- Response time-based scaling
- Custom metric scaling rules
- Cooldown period management
- Manual scaling override

**Usage**:
```typescript
import { autoScalingService } from '@voxlink/shared/services/auto-scaling.service';

// Register service for auto-scaling
autoScalingService.registerService('api-gateway');

// Add scaling rule
autoScalingService.addScalingRule('api-gateway', {
  id: 'cpu_scale_up',
  name: 'CPU Scale Up',
  metric: 'cpu',
  operator: 'gt',
  threshold: 70,
  action: 'scale_up',
  cooldownPeriod: 300000,
  minInstances: 2,
  maxInstances: 10,
  scaleAmount: 1,
  enabled: true
});
```

### 6. Circuit Breaker Service

**Purpose**: Prevents cascade failures by monitoring service health.

**Features**:
- Configurable failure thresholds
- Automatic recovery attempts
- Half-open state testing
- Service health monitoring
- Graceful degradation

**Usage**:
```typescript
import { circuitBreakerService } from '@voxlink/shared/services/circuit-breaker.service';

// Execute with circuit breaker protection
const result = await circuitBreakerService.execute(
  'external-api',
  () => callExternalAPI(),
  {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 60000
  }
);
```

## Middleware

### Performance Middleware

The system provides various Express middleware for performance optimization:

```typescript
import { getPerformanceMiddleware } from '@voxlink/shared/performance';

const middleware = getPerformanceMiddleware();

app.use(middleware.compression);        // Gzip compression
app.use(middleware.responseTime);       // Response time tracking
app.use(middleware.security);           // Security headers
app.use(middleware.cacheHeaders);       // Cache control headers
app.use(middleware.conditionalRequests); // ETag/Last-Modified
app.use(middleware.staticAssets);       // Static asset optimization
```

### Caching Middleware

Intelligent caching middleware with multiple strategies:

```typescript
import { getCachingMiddleware, CacheStrategies } from '@voxlink/shared/performance';

const cache = getCachingMiddleware();

// Apply different caching strategies
app.use('/api/numbers/search', cache.cache(CacheStrategies.shortTerm(300)));
app.use('/api/reports', cache.cache(CacheStrategies.reports(7200)));
app.use('/api/analytics', cache.cache(CacheStrategies.analytics(1800)));
```

## Configuration

### Environment Variables

```bash
# Cache Configuration
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_KEY_PREFIX=voxlink:
CACHE_DEFAULT_TTL=3600

# CDN Configuration
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_BASE_URL=https://cdn.voxlink.com
CDN_API_KEY=your_api_key
CDN_ZONE_ID=your_zone_id

# Monitoring Configuration
PERFORMANCE_MONITORING_ENABLED=true
METRICS_INTERVAL=30000
ALERT_RESPONSE_TIME_THRESHOLD=2000
ALERT_ERROR_RATE_THRESHOLD=5
ALERT_CPU_THRESHOLD=80
ALERT_MEMORY_THRESHOLD=85

# Auto-Scaling Configuration
AUTO_SCALING_ENABLED=true
SCALING_MONITORING_INTERVAL=60000
AUTO_SCALING_DEFAULT_RULES=true

# Circuit Breaker Configuration
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60000
CIRCUIT_BREAKER_MONITORING_PERIOD=60000

# Query Optimization Configuration
QUERY_OPTIMIZATION_ENABLED=true
SLOW_QUERY_THRESHOLD=1000
AUTO_INDEX_SUGGESTIONS=true
```

### Configuration Presets

The system includes predefined configuration presets:

```typescript
import { performancePresets } from '@voxlink/shared/config/performance.config';

// High-performance preset for production
const config = performancePresets.highPerformance;

// Cost-optimized preset for budget deployments
const config = performancePresets.costOptimized;

// Development preset for local development
const config = performancePresets.development;
```

## Database Optimizations

### Performance Indexes

The system includes comprehensive database indexes for optimal query performance:

```sql
-- Country and area code searches
CREATE INDEX CONCURRENTLY idx_virtual_numbers_country_area 
ON "VirtualNumber" (country_code, area_code) 
WHERE status = 'AVAILABLE';

-- Owner queries with status
CREATE INDEX CONCURRENTLY idx_virtual_numbers_owner_status 
ON "VirtualNumber" (owner_id, status, created_at DESC) 
WHERE owner_id IS NOT NULL;

-- Feature-based searches using GIN
CREATE INDEX CONCURRENTLY idx_virtual_numbers_features 
ON "VirtualNumber" USING GIN (features) 
WHERE status = 'AVAILABLE';

-- Time-series data for usage records
CREATE INDEX CONCURRENTLY idx_usage_records_number_timestamp 
ON "UsageRecord" (number_id, timestamp DESC);
```

### Query Optimization

The query optimizer automatically:

1. **Detects Slow Queries**: Logs queries exceeding threshold
2. **Suggests Indexes**: Analyzes query patterns for index recommendations
3. **Generates Migrations**: Creates SQL migration files for suggested indexes
4. **Monitors Performance**: Tracks query execution times and patterns

## Monitoring and Alerting

### Performance Metrics

The system tracks comprehensive performance metrics:

- **Response Time**: API endpoint response times
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Cache Hit Rate**: Cache effectiveness
- **Database Performance**: Query execution times
- **System Resources**: CPU, memory, disk usage
- **Network Latency**: Connection and transfer times

### Health Checks

Comprehensive health checking across all components:

```typescript
// Get overall system health
const health = await performanceService.getSystemHealth();

// Check individual service health
const isHealthy = await performanceService.isHealthy();

// Get detailed performance report
const report = await performanceService.getPerformanceReport();
```

### Alerting

Configurable alerting based on performance thresholds:

- **Response Time Alerts**: When API responses exceed thresholds
- **Error Rate Alerts**: When error rates spike
- **Resource Alerts**: When CPU/memory usage is high
- **Cache Alerts**: When cache hit rates drop
- **Circuit Breaker Alerts**: When services become unavailable

## API Endpoints

### Performance Monitoring

```
GET /api/performance/stats           # Overall performance statistics
GET /api/performance/endpoints       # Endpoint-specific metrics
GET /api/performance/slow-requests   # Recent slow requests
GET /api/performance/health          # Health check with metrics
GET /api/performance/dashboard       # Dashboard data
GET /api/performance/trends          # Performance trends
POST /api/performance/reset          # Reset metrics (admin)
```

### Cache Management

```
POST /api/admin/cache/warm           # Warm cache with data
POST /api/admin/cache/invalidate     # Invalidate cache by pattern
```

### Performance Optimization

```
POST /api/admin/optimize             # Run performance optimization
```

## Best Practices

### Caching Strategy

1. **Cache Frequently Accessed Data**: User profiles, number availability, country lists
2. **Use Appropriate TTL**: Short for dynamic data, long for static data
3. **Implement Cache Warming**: Pre-populate cache with popular data
4. **Tag-Based Invalidation**: Use tags for efficient cache invalidation
5. **Monitor Hit Rates**: Aim for >80% cache hit rate

### Query Optimization

1. **Index Critical Queries**: Add indexes for WHERE, ORDER BY, and JOIN clauses
2. **Monitor Slow Queries**: Set threshold at 1000ms or lower
3. **Use Partial Indexes**: For filtered queries (e.g., WHERE status = 'ACTIVE')
4. **Optimize N+1 Queries**: Use eager loading or batch queries
5. **Regular Analysis**: Review query patterns monthly

### Auto-Scaling

1. **Set Appropriate Thresholds**: CPU 70%, Memory 80%, Response Time 2s
2. **Configure Cooldown Periods**: Prevent thrashing with 5-10 minute cooldowns
3. **Monitor Scaling Events**: Review scaling actions for optimization
4. **Test Scaling Rules**: Validate rules in staging environment
5. **Plan for Peak Load**: Set maximum instances for expected peak traffic

### Circuit Breakers

1. **Protect External Services**: Wrap all external API calls
2. **Set Reasonable Thresholds**: 5 failures in 60 seconds
3. **Implement Fallbacks**: Provide degraded functionality when circuits open
4. **Monitor Circuit States**: Alert on circuit breaker state changes
5. **Test Recovery**: Verify services recover properly after failures

## Troubleshooting

### Common Issues

1. **Low Cache Hit Rate**
   - Check TTL settings
   - Verify cache warming
   - Review cache key patterns
   - Monitor cache eviction

2. **Slow Database Queries**
   - Review query execution plans
   - Check index usage
   - Analyze query patterns
   - Consider query rewriting

3. **High Memory Usage**
   - Check cache size limits
   - Review object retention
   - Monitor memory leaks
   - Optimize data structures

4. **Circuit Breaker Thrashing**
   - Adjust failure thresholds
   - Increase recovery timeout
   - Review service dependencies
   - Implement proper fallbacks

### Performance Debugging

1. **Enable Debug Logging**: Set log level to debug for detailed information
2. **Use Performance Profiler**: Profile application under load
3. **Monitor Resource Usage**: Track CPU, memory, and network usage
4. **Analyze Slow Requests**: Review slow request logs and traces
5. **Load Testing**: Use tools like Artillery or k6 for load testing

## Migration Guide

### Existing Applications

To integrate the performance system into existing applications:

1. **Install Dependencies**:
   ```bash
   npm install @voxlink/shared
   ```

2. **Initialize Performance System**:
   ```typescript
   import performanceSystem from '@voxlink/shared/performance';
   
   await performanceSystem.initialize();
   ```

3. **Add Middleware**:
   ```typescript
   const middleware = getPerformanceMiddleware();
   app.use(middleware.compression);
   app.use(middleware.responseTime);
   // ... other middleware
   ```

4. **Configure Environment Variables**: Set up required environment variables

5. **Update Database**: Run performance index migrations

6. **Monitor and Tune**: Monitor performance and adjust configuration

### Gradual Rollout

1. **Start with Monitoring**: Enable performance monitoring first
2. **Add Caching**: Implement caching for read-heavy endpoints
3. **Enable Compression**: Add compression middleware
4. **Implement Circuit Breakers**: Protect external service calls
5. **Configure Auto-Scaling**: Set up scaling rules based on metrics

## Contributing

When contributing to the performance system:

1. **Write Tests**: Include comprehensive tests for new features
2. **Update Documentation**: Keep documentation current with changes
3. **Monitor Performance**: Ensure changes don't degrade performance
4. **Follow Patterns**: Use established patterns and conventions
5. **Review Metrics**: Validate that metrics are properly recorded

## Support

For support with the performance optimization system:

1. **Check Logs**: Review application and performance system logs
2. **Monitor Metrics**: Use performance dashboard for insights
3. **Review Configuration**: Verify environment variables and settings
4. **Test Components**: Use health check endpoints to verify system status
5. **Consult Documentation**: Reference this guide and API documentation