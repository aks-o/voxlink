# Performance and Caching Services

This directory contains services and utilities for implementing caching, performance optimization, and monitoring in the VoxLink application.

## Services Overview

### CacheService

A comprehensive Redis-based caching service with advanced features:

- **Multi-level caching** with tags for selective invalidation
- **Automatic compression** for large values
- **Connection resilience** with automatic reconnection
- **Performance metrics** tracking (hit rate, response times)
- **Batch operations** for efficient bulk operations

```typescript
import { CacheService } from '@voxlink/shared';

const cache = new CacheService({
  host: 'localhost',
  port: 6379,
  keyPrefix: 'voxlink:',
  defaultTtl: 3600,
});

// Basic operations
await cache.set('user:123', userData, { ttl: 1800, tags: ['users'] });
const user = await cache.get<User>('user:123');

// Batch operations
await cache.mset([
  { key: 'user:1', value: user1 },
  { key: 'user:2', value: user2 },
]);

// Tag-based invalidation
await cache.invalidateByTag('users');
```

### QueryOptimizerService

Database query performance monitoring and optimization:

- **Query execution tracking** with performance metrics
- **Slow query detection** and alerting
- **Index suggestions** based on query patterns
- **Query optimization** recommendations
- **Performance statistics** and reporting

```typescript
import { QueryOptimizerService } from '@voxlink/shared';

const optimizer = new QueryOptimizerService();

// Record query metrics
optimizer.recordQueryMetrics({
  query: 'SELECT * FROM users WHERE email = ?',
  executionTime: 150,
  rowsAffected: 1,
  timestamp: new Date(),
});

// Get optimization suggestions
const suggestions = optimizer.suggestIndexes();
const slowQueries = optimizer.getSlowQueries();
```

### CDNService

Content Delivery Network integration for static assets:

- **Multi-provider support** (CloudFlare, AWS, Azure, GCP)
- **Automatic image optimization** with format conversion
- **Responsive image generation** for different screen sizes
- **Cache invalidation** by URL or tags
- **Analytics and performance metrics**

```typescript
import { CDNService } from '@voxlink/shared';

const cdn = new CDNService({
  provider: 'cloudflare',
  baseUrl: 'https://cdn.voxlink.com',
  apiKey: 'your-api-key',
});

// Upload and optimize assets
const metadata = await cdn.uploadAsset('/images/logo.png', imageBuffer, {
  compress: true,
  minify: false,
  tags: ['branding'],
});

// Generate responsive images
const variants = await cdn.generateResponsiveImages(
  '/images/hero.jpg',
  imageBuffer,
  [320, 640, 1024, 1920]
);
```

### PaginationService

Advanced pagination utilities for large datasets:

- **Offset-based pagination** for traditional page navigation
- **Cursor-based pagination** for better performance on large datasets
- **Lazy loading** with automatic batching
- **Infinite scroll** implementation
- **Search pagination** with debouncing

```typescript
import { PaginationService } from '@voxlink/shared';

// Offset-based pagination
const result = await PaginationService.paginate(
  async (offset, limit) => {
    const data = await db.users.findMany({ skip: offset, take: limit });
    const total = await db.users.count();
    return { data, total };
  },
  { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
);

// Cursor-based pagination
const cursorResult = await PaginationService.paginateWithCursor(
  async (cursor, limit) => {
    const data = await db.users.findMany({
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
    });
    return {
      data,
      nextCursor: data.length > 0 ? data[data.length - 1].id : null,
      previousCursor: cursor,
    };
  },
  { cursor: null, limit: 20 }
);

// Lazy loading
const loader = PaginationService.createLazyLoader(
  async (offset, limit) => {
    return await db.users.findMany({ skip: offset, take: limit });
  },
  { batchSize: 20, preloadNext: true }
);

const batch = await loader.next();
```

## Performance Middleware

### Performance Monitoring Middleware

Tracks request performance, response times, and system metrics:

```typescript
import { createPerformanceMonitoringMiddleware } from '@voxlink/shared';

app.use(createPerformanceMonitoringMiddleware());
```

### Compression Middleware

Smart content compression based on content type:

```typescript
import { createCompressionMiddleware } from '@voxlink/shared';

app.use(createCompressionMiddleware({
  enableCompression: true,
  compressionLevel: 6,
  compressionThreshold: 1024,
}));
```

### Cache Headers Middleware

Automatic cache header management:

```typescript
import { createCacheMiddleware } from '@voxlink/shared';

app.use(createCacheMiddleware({
  enableCaching: true,
  defaultCacheTtl: 3600,
  enableEtag: true,
}));

// In route handlers
app.get('/api/data', (req, res) => {
  res.cache({ ttl: 1800, private: false });
  res.json(data);
});
```

## Database Optimizations

### Indexes

The system includes optimized database indexes for common query patterns:

```sql
-- Geographic searches
CREATE INDEX CONCURRENTLY idx_virtual_numbers_country_area 
ON "VirtualNumber" (country_code, area_code) 
WHERE status = 'AVAILABLE';

-- Owner queries
CREATE INDEX CONCURRENTLY idx_virtual_numbers_owner_status 
ON "VirtualNumber" (owner_id, status, created_at DESC);

-- Feature-based searches
CREATE INDEX CONCURRENTLY idx_virtual_numbers_features 
ON "VirtualNumber" USING GIN (features);
```

### Query Optimization

- **Prepared statements** for frequently executed queries
- **Connection pooling** for efficient database connections
- **Query result caching** for expensive operations
- **Materialized views** for complex aggregations

## Performance Monitoring

### Metrics Tracked

- **Response times** for all API endpoints
- **Cache hit rates** and performance
- **Database query performance**
- **Memory and CPU usage**
- **Error rates** and patterns

### Health Checks

```typescript
// Get system health status
const health = performanceMonitor.getHealthMetrics();
// Returns: { status: 'healthy' | 'degraded' | 'unhealthy', ... }

// Get performance statistics
const stats = performanceMonitor.getPerformanceStats();
// Returns: { totalRequests, averageResponseTime, errorRate, ... }
```

## Best Practices

### Caching Strategy

1. **Cache frequently accessed data** with appropriate TTL
2. **Use tags for selective invalidation** of related data
3. **Implement cache warming** for critical data
4. **Monitor cache hit rates** and adjust strategies

### Database Performance

1. **Use appropriate indexes** for query patterns
2. **Implement query result caching** for expensive operations
3. **Use pagination** for large result sets
4. **Monitor slow queries** and optimize regularly

### API Performance

1. **Enable compression** for text-based responses
2. **Use appropriate cache headers** for different content types
3. **Implement rate limiting** to prevent abuse
4. **Monitor response times** and set alerts

### CDN Usage

1. **Optimize images** before uploading to CDN
2. **Use appropriate cache policies** for different asset types
3. **Implement cache invalidation** strategies
4. **Monitor CDN performance** and costs

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# CDN Configuration
CDN_PROVIDER=cloudflare
CDN_BASE_URL=https://cdn.voxlink.com
CDN_API_KEY=your-api-key

# Performance Settings
CACHE_DEFAULT_TTL=3600
COMPRESSION_LEVEL=6
SLOW_QUERY_THRESHOLD=1000
```

### Service Configuration

```typescript
// Cache service configuration
const cacheConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  keyPrefix: 'voxlink:',
  defaultTtl: 3600,
  maxRetries: 3,
};

// CDN service configuration
const cdnConfig = {
  provider: 'cloudflare',
  baseUrl: process.env.CDN_BASE_URL,
  apiKey: process.env.CDN_API_KEY,
  cacheTtl: 86400,
  enableCompression: true,
};
```

## Testing

All services include comprehensive test suites:

```bash
# Run all performance service tests
npm test packages/shared/src/services

# Run specific service tests
npm test packages/shared/src/services/__tests__/cache.service.test.ts
npm test packages/shared/src/services/__tests__/pagination.service.test.ts
```

## Monitoring and Alerts

### Performance Alerts

- **Slow response times** (> 1 second)
- **High error rates** (> 5%)
- **Low cache hit rates** (< 50%)
- **High memory usage** (> 80%)

### Dashboard Metrics

- **Request volume** and response times
- **Cache performance** and hit rates
- **Database query performance**
- **System resource usage**

## Troubleshooting

### Common Issues

1. **Low cache hit rates**: Review caching strategy and TTL settings
2. **Slow database queries**: Check indexes and query optimization
3. **High memory usage**: Review cache size limits and cleanup policies
4. **CDN issues**: Check API credentials and network connectivity

### Debug Tools

```typescript
// Enable debug logging
process.env.DEBUG = 'voxlink:cache,voxlink:performance';

// Get detailed performance stats
const stats = performanceMonitor.getPerformanceStats();
console.log('Performance Stats:', stats);

// Check cache health
const cacheHealth = cache.isHealthy();
console.log('Cache Health:', cacheHealth);
```