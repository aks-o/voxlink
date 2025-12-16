import { Request, Response } from 'express';
import { logger } from './logger';

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  system: {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    platform: string;
    nodeVersion: string;
  };
}

export type HealthCheck = () => Promise<HealthCheckResult>;

export class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map();
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  // Register a health check
  register(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
    logger.info(`Health check registered: ${name}`, { service: this.serviceName });
  }

  // Remove a health check
  unregister(name: string): void {
    this.checks.delete(name);
    logger.info(`Health check unregistered: ${name}`, { service: this.serviceName });
  }

  // Run all health checks
  async runChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [name, check] of this.checks) {
      const startTime = Date.now();
      
      try {
        const result = await Promise.race([
          check(),
          new Promise<HealthCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 10000)
          ),
        ]);

        result.responseTime = Date.now() - startTime;
        results.push(result);

        logger.logHealthCheck(name, result.status, result.details);

      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        const result: HealthCheckResult = {
          name,
          status: 'unhealthy',
          responseTime,
          error: error.message,
        };

        results.push(result);
        logger.logHealthCheck(name, 'unhealthy', { error: error.message });
      }
    }

    return results;
  }

  // Get overall system health
  async getSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now();
    const checks = await this.runChecks();
    
    // Determine overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const systemHealth: SystemHealth = {
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
    logger.info('System health check completed', {
      status: overallStatus,
      totalTime,
      checksCount: checks.length,
    });

    return systemHealth;
  }

  // Express middleware for health endpoint
  healthEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const health = await this.getSystemHealth();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error: any) {
        logger.error('Health check endpoint error', { error: error.message });
        
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
    return (req: Request, res: Response) => {
      res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: this.serviceName,
      });
    };
  }

  // Readiness check (only critical dependencies)
  readinessEndpoint(criticalChecks: string[] = []) {
    return async (req: Request, res: Response) => {
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

      } catch (error: any) {
        logger.error('Readiness check error', { error: error.message });
        
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

// Common health checks
export const commonHealthChecks = {
  // Database health check
  database: (connectionTest: () => Promise<boolean>): HealthCheck => {
    return async (): Promise<HealthCheckResult> => {
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
      } catch (error: any) {
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
  redis: (pingTest: () => Promise<boolean>): HealthCheck => {
    return async (): Promise<HealthCheckResult> => {
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
      } catch (error: any) {
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
  externalService: (serviceName: string, url: string): HealthCheck => {
    return async (): Promise<HealthCheckResult> => {
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
      } catch (error: any) {
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
  memory: (maxMemoryMB: number = 512): HealthCheck => {
    return async (): Promise<HealthCheckResult> => {
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
  diskSpace: (maxUsagePercent: number = 90): HealthCheck => {
    return async (): Promise<HealthCheckResult> => {
      try {
        // This is a simplified check - in production you'd use a proper disk space library
        const stats = await import('fs').then(fs => fs.promises.stat('.'));
        
        return {
          name: 'disk_space',
          status: 'healthy', // Simplified - always healthy for now
          responseTime: 0,
          details: {
            maxUsagePercent,
            // In a real implementation, you'd calculate actual disk usage
          },
        };
      } catch (error: any) {
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
  custom: (name: string, checkFn: () => Promise<{ healthy: boolean; details?: any }>): HealthCheck => {
    return async (): Promise<HealthCheckResult> => {
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
      } catch (error: any) {
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
export class MetricsCollector {
  private metrics: Map<string, any> = new Map();
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  // Increment a counter
  increment(metric: string, tags?: Record<string, string>): void {
    const key = this.getMetricKey(metric, tags);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
    
    logger.logBusinessMetric({
      metric,
      value: current + 1,
      tags,
    });
  }

  // Set a gauge value
  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(metric, tags);
    this.metrics.set(key, value);
    
    logger.logBusinessMetric({
      metric,
      value,
      tags,
    });
  }

  // Record a histogram value (timing, size, etc.)
  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(metric, tags);
    const existing = this.metrics.get(key) || [];
    existing.push(value);
    this.metrics.set(key, existing);
    
    logger.logBusinessMetric({
      metric,
      value,
      tags,
    });
  }

  // Get all metrics (for Prometheus export)
  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics);
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  private getMetricKey(metric: string, tags?: Record<string, string>): string {
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

// Global metrics collector
export const metrics = new MetricsCollector('voxlink-default');