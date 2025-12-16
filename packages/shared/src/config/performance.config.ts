import { PerformanceConfig } from '../services/performance-integration.service';

/**
 * Default performance configuration
 */
export const defaultPerformanceConfig: PerformanceConfig = {
  cache: {
    enabled: process.env.REDIS_ENABLED === 'true' || true,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'voxlink:',
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'), // 1 hour
  },
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true' || false,
    provider: (process.env.CDN_PROVIDER as any) || 'cloudflare',
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.voxlink.com',
    apiKey: process.env.CDN_API_KEY,
    zoneId: process.env.CDN_ZONE_ID,
  },
  monitoring: {
    enabled: process.env.PERFORMANCE_MONITORING_ENABLED === 'true' || true,
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '30000'), // 30 seconds
    alertThresholds: {
      responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '2000'), // 2 seconds
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || '5'), // 5%
      cpuUsage: parseFloat(process.env.ALERT_CPU_THRESHOLD || '80'), // 80%
      memoryUsage: parseFloat(process.env.ALERT_MEMORY_THRESHOLD || '85'), // 85%
    },
  },
  autoScaling: {
    enabled: process.env.AUTO_SCALING_ENABLED === 'true' || false,
    monitoringInterval: parseInt(process.env.SCALING_MONITORING_INTERVAL || '60000'), // 1 minute
    defaultRules: process.env.AUTO_SCALING_DEFAULT_RULES === 'true' || true,
  },
  circuitBreaker: {
    enabled: process.env.CIRCUIT_BREAKER_ENABLED === 'true' || true,
    defaultConfig: {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
      recoveryTimeout: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT || '60000'), // 1 minute
      monitoringPeriod: parseInt(process.env.CIRCUIT_BREAKER_MONITORING_PERIOD || '60000'), // 1 minute
    },
  },
  queryOptimization: {
    enabled: process.env.QUERY_OPTIMIZATION_ENABLED === 'true' || true,
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'), // 1 second
    autoIndexSuggestions: process.env.AUTO_INDEX_SUGGESTIONS === 'true' || true,
  },
};

/**
 * Environment-specific configurations
 */
export const performanceConfigs = {
  development: {
    ...defaultPerformanceConfig,
    monitoring: {
      ...defaultPerformanceConfig.monitoring,
      metricsInterval: 60000, // 1 minute in development
    },
    autoScaling: {
      ...defaultPerformanceConfig.autoScaling,
      enabled: false, // Disable auto-scaling in development
    },
    cache: {
      ...defaultPerformanceConfig.cache,
      defaultTtl: 300, // 5 minutes in development
    },
  },
  
  staging: {
    ...defaultPerformanceConfig,
    autoScaling: {
      ...defaultPerformanceConfig.autoScaling,
      enabled: true,
    },
    cdn: {
      ...defaultPerformanceConfig.cdn,
      enabled: true,
    },
  },
  
  production: {
    ...defaultPerformanceConfig,
    monitoring: {
      ...defaultPerformanceConfig.monitoring,
      metricsInterval: 15000, // 15 seconds in production
      alertThresholds: {
        responseTime: 1000, // Stricter in production
        errorRate: 2, // Stricter in production
        cpuUsage: 70, // Stricter in production
        memoryUsage: 80, // Stricter in production
      },
    },
    autoScaling: {
      ...defaultPerformanceConfig.autoScaling,
      enabled: true,
      monitoringInterval: 30000, // 30 seconds in production
    },
    cdn: {
      ...defaultPerformanceConfig.cdn,
      enabled: true,
    },
    cache: {
      ...defaultPerformanceConfig.cache,
      defaultTtl: 7200, // 2 hours in production
    },
  },
};

/**
 * Get performance configuration for current environment
 */
export function getPerformanceConfig(): PerformanceConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return performanceConfigs.production;
    case 'staging':
      return performanceConfigs.staging;
    case 'development':
    default:
      return performanceConfigs.development;
  }
}

/**
 * Validate performance configuration
 */
export function validatePerformanceConfig(config: PerformanceConfig): string[] {
  const errors: string[] = [];

  // Validate cache configuration
  if (config.cache.enabled) {
    if (!config.cache.host) {
      errors.push('Cache host is required when cache is enabled');
    }
    if (config.cache.port <= 0 || config.cache.port > 65535) {
      errors.push('Cache port must be between 1 and 65535');
    }
    if (config.cache.defaultTtl <= 0) {
      errors.push('Cache default TTL must be greater than 0');
    }
  }

  // Validate CDN configuration
  if (config.cdn.enabled) {
    if (!config.cdn.baseUrl) {
      errors.push('CDN base URL is required when CDN is enabled');
    }
    if (!['cloudflare', 'aws', 'azure', 'gcp'].includes(config.cdn.provider)) {
      errors.push('CDN provider must be one of: cloudflare, aws, azure, gcp');
    }
  }

  // Validate monitoring configuration
  if (config.monitoring.enabled) {
    if (config.monitoring.metricsInterval < 1000) {
      errors.push('Metrics interval must be at least 1000ms');
    }
    if (config.monitoring.alertThresholds.responseTime <= 0) {
      errors.push('Response time threshold must be greater than 0');
    }
    if (config.monitoring.alertThresholds.errorRate < 0 || config.monitoring.alertThresholds.errorRate > 100) {
      errors.push('Error rate threshold must be between 0 and 100');
    }
    if (config.monitoring.alertThresholds.cpuUsage < 0 || config.monitoring.alertThresholds.cpuUsage > 100) {
      errors.push('CPU usage threshold must be between 0 and 100');
    }
    if (config.monitoring.alertThresholds.memoryUsage < 0 || config.monitoring.alertThresholds.memoryUsage > 100) {
      errors.push('Memory usage threshold must be between 0 and 100');
    }
  }

  // Validate auto-scaling configuration
  if (config.autoScaling.enabled) {
    if (config.autoScaling.monitoringInterval < 10000) {
      errors.push('Auto-scaling monitoring interval must be at least 10000ms');
    }
  }

  // Validate circuit breaker configuration
  if (config.circuitBreaker.enabled) {
    if (config.circuitBreaker.defaultConfig.failureThreshold <= 0) {
      errors.push('Circuit breaker failure threshold must be greater than 0');
    }
    if (config.circuitBreaker.defaultConfig.recoveryTimeout < 1000) {
      errors.push('Circuit breaker recovery timeout must be at least 1000ms');
    }
    if (config.circuitBreaker.defaultConfig.monitoringPeriod < 1000) {
      errors.push('Circuit breaker monitoring period must be at least 1000ms');
    }
  }

  // Validate query optimization configuration
  if (config.queryOptimization.enabled) {
    if (config.queryOptimization.slowQueryThreshold <= 0) {
      errors.push('Slow query threshold must be greater than 0');
    }
  }

  return errors;
}

/**
 * Performance configuration presets for different use cases
 */
export const performancePresets = {
  /**
   * High-performance preset for production systems
   */
  highPerformance: {
    ...defaultPerformanceConfig,
    cache: {
      ...defaultPerformanceConfig.cache,
      defaultTtl: 14400, // 4 hours
    },
    monitoring: {
      ...defaultPerformanceConfig.monitoring,
      metricsInterval: 10000, // 10 seconds
      alertThresholds: {
        responseTime: 500, // Very strict
        errorRate: 1, // Very strict
        cpuUsage: 60, // Very strict
        memoryUsage: 70, // Very strict
      },
    },
    autoScaling: {
      ...defaultPerformanceConfig.autoScaling,
      enabled: true,
      monitoringInterval: 15000, // 15 seconds
    },
    cdn: {
      ...defaultPerformanceConfig.cdn,
      enabled: true,
    },
  },

  /**
   * Cost-optimized preset for budget-conscious deployments
   */
  costOptimized: {
    ...defaultPerformanceConfig,
    cache: {
      ...defaultPerformanceConfig.cache,
      defaultTtl: 1800, // 30 minutes
    },
    monitoring: {
      ...defaultPerformanceConfig.monitoring,
      metricsInterval: 120000, // 2 minutes
    },
    autoScaling: {
      ...defaultPerformanceConfig.autoScaling,
      enabled: true,
      monitoringInterval: 300000, // 5 minutes
    },
    cdn: {
      ...defaultPerformanceConfig.cdn,
      enabled: false, // Disable CDN to save costs
    },
  },

  /**
   * Development preset for local development
   */
  development: {
    ...defaultPerformanceConfig,
    cache: {
      ...defaultPerformanceConfig.cache,
      defaultTtl: 60, // 1 minute
    },
    monitoring: {
      ...defaultPerformanceConfig.monitoring,
      metricsInterval: 60000, // 1 minute
      alertThresholds: {
        responseTime: 5000, // Relaxed for development
        errorRate: 10, // Relaxed for development
        cpuUsage: 90, // Relaxed for development
        memoryUsage: 90, // Relaxed for development
      },
    },
    autoScaling: {
      ...defaultPerformanceConfig.autoScaling,
      enabled: false, // Disabled for development
    },
    cdn: {
      ...defaultPerformanceConfig.cdn,
      enabled: false, // Disabled for development
    },
  },
};