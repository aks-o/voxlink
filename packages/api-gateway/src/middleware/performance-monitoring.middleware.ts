import { Request, Response, NextFunction } from 'express';
import { QueryOptimizerService } from '@voxlink/shared';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  startTime: number;
  endTime?: number;
  responseTime?: number;
  statusCode?: number;
  contentLength?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

interface ApiEndpointStats {
  endpoint: string;
  method: string;
  totalRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  lastAccessed: Date;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private queryOptimizer: QueryOptimizerService;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private endpointStats: Map<string, ApiEndpointStats> = new Map();
  private slowRequestThreshold = 1000; // 1 second
  private maxMetricsRetention = 1000; // Keep last 1000 requests

  constructor() {
    this.queryOptimizer = new QueryOptimizerService();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Middleware to track request performance
   */
  trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      const startCpuUsage = process.cpuUsage();

      // Add request ID to headers
      req.headers['x-request-id'] = requestId;
      res.setHeader('X-Request-ID', requestId);

      // Store initial metrics
      const metrics: PerformanceMetrics = {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        startTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: startCpuUsage,
      };

      this.metrics.set(requestId, metrics);

      // Track response
      res.on('finish', () => {
        this.recordResponseMetrics(requestId, res, startCpuUsage);
      });

      // Track errors
      res.on('error', (error) => {
        logger.error('Response error', { requestId, error });
      });

      next();
    };
  }

  /**
   * Record response metrics
   */
  private recordResponseMetrics(
    requestId: string,
    res: Response,
    startCpuUsage: NodeJS.CpuUsage
  ): void {
    const metrics = this.metrics.get(requestId);
    if (!metrics) return;

    const endTime = Date.now();
    const responseTime = endTime - metrics.startTime;
    const endCpuUsage = process.cpuUsage(startCpuUsage);

    // Update metrics
    metrics.endTime = endTime;
    metrics.responseTime = responseTime;
    metrics.statusCode = res.statusCode;
    metrics.contentLength = parseInt(res.getHeader('content-length') as string) || 0;

    // Update endpoint statistics
    this.updateEndpointStats(metrics);

    // Log slow requests
    if (responseTime > this.slowRequestThreshold) {
      logger.warn('Slow request detected', {
        requestId,
        method: metrics.method,
        url: metrics.url,
        responseTime,
        statusCode: metrics.statusCode,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: {
          user: endCpuUsage.user / 1000, // Convert to milliseconds
          system: endCpuUsage.system / 1000,
        },
      });
    }

    // Clean up old metrics
    this.cleanupMetrics();
  }

  /**
   * Update endpoint statistics
   */
  private updateEndpointStats(metrics: PerformanceMetrics): void {
    const endpointKey = `${metrics.method}:${this.normalizeUrl(metrics.url)}`;
    const existing = this.endpointStats.get(endpointKey);

    if (existing) {
      existing.totalRequests++;
      existing.averageResponseTime = (
        (existing.averageResponseTime * (existing.totalRequests - 1) + metrics.responseTime!) /
        existing.totalRequests
      );
      existing.minResponseTime = Math.min(existing.minResponseTime, metrics.responseTime!);
      existing.maxResponseTime = Math.max(existing.maxResponseTime, metrics.responseTime!);
      existing.errorRate = this.calculateErrorRate(endpointKey);
      existing.lastAccessed = new Date();
    } else {
      this.endpointStats.set(endpointKey, {
        endpoint: this.normalizeUrl(metrics.url),
        method: metrics.method,
        totalRequests: 1,
        averageResponseTime: metrics.responseTime!,
        minResponseTime: metrics.responseTime!,
        maxResponseTime: metrics.responseTime!,
        errorRate: metrics.statusCode! >= 400 ? 100 : 0,
        lastAccessed: new Date(),
      });
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    topSlowEndpoints: ApiEndpointStats[];
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  } {
    const allMetrics = Array.from(this.metrics.values()).filter(m => m.responseTime);
    const totalRequests = allMetrics.length;
    const slowRequests = allMetrics.filter(m => m.responseTime! > this.slowRequestThreshold).length;
    const errorRequests = allMetrics.filter(m => m.statusCode! >= 400).length;

    const averageResponseTime = totalRequests > 0
      ? allMetrics.reduce((sum, m) => sum + m.responseTime!, 0) / totalRequests
      : 0;

    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    const topSlowEndpoints = Array.from(this.endpointStats.values())
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime,
      slowRequests,
      errorRate,
      topSlowEndpoints,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * Get endpoint-specific statistics
   */
  getEndpointStats(endpoint?: string): ApiEndpointStats[] {
    const stats = Array.from(this.endpointStats.values());

    if (endpoint) {
      return stats.filter(s => s.endpoint.includes(endpoint));
    }

    return stats.sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /**
   * Get recent slow requests
   */
  getSlowRequests(limit = 10): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .filter(m => m.responseTime && m.responseTime > this.slowRequestThreshold)
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
      .slice(0, limit);
  }

  /**
   * Get query optimization suggestions
   */
  getQueryOptimizationSuggestions() {
    return {
      slowQueries: this.queryOptimizer.getSlowQueries(),
      indexSuggestions: this.queryOptimizer.suggestIndexes(),
      queryStats: this.queryOptimizer.getQueryStats(),
    };
  }

  /**
   * Record database query metrics
   */
  recordQueryMetrics(query: string, executionTime: number, rowsAffected: number): void {
    this.queryOptimizer.recordQueryMetrics({
      query,
      executionTime,
      rowsAffected,
      timestamp: new Date(),
    });
  }

  /**
   * Health check endpoint data
   */
  getHealthMetrics(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  } {
    const stats = this.getPerformanceStats();
    const memoryUsagePercent = (stats.memoryUsage.heapUsed / stats.memoryUsage.heapTotal) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (stats.errorRate > 10 || stats.averageResponseTime > 2000 || memoryUsagePercent > 90) {
      status = 'unhealthy';
    } else if (stats.errorRate > 5 || stats.averageResponseTime > 1000 || memoryUsagePercent > 80) {
      status = 'degraded';
    }

    return {
      status,
      responseTime: stats.averageResponseTime,
      errorRate: stats.errorRate,
      memoryUsage: memoryUsagePercent,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to percentage
      uptime: stats.uptime,
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.endpointStats.clear();
    // this.queryOptimizer.resetStats(); // Method doesn't exist on QueryOptimizerService
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  private normalizeUrl(url: string): string {
    // Remove query parameters and normalize path parameters
    return url
      .split('?')[0]
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
  }

  private calculateErrorRate(endpointKey: string): number {
    const endpointMetrics = Array.from(this.metrics.values())
      .filter(m => `${m.method}:${this.normalizeUrl(m.url)}` === endpointKey && m.statusCode);

    if (endpointMetrics.length === 0) return 0;

    const errorCount = endpointMetrics.filter(m => m.statusCode! >= 400).length;
    return (errorCount / endpointMetrics.length) * 100;
  }

  private cleanupMetrics(): void {
    if (this.metrics.size > this.maxMetricsRetention) {
      const sortedMetrics = Array.from(this.metrics.entries())
        .sort(([, a], [, b]) => (b.startTime || 0) - (a.startTime || 0));

      // Keep only the most recent metrics
      const toKeep = sortedMetrics.slice(0, this.maxMetricsRetention);
      this.metrics.clear();

      for (const [key, value] of toKeep) {
        this.metrics.set(key, value);
      }
    }
  }
}

/**
 * Express middleware factory
 */
export function createPerformanceMonitoringMiddleware() {
  const monitor = PerformanceMonitoringService.getInstance();
  return monitor.trackRequest();
}

/**
 * Database query tracking middleware
 */
export function trackDatabaseQuery(query: string, executionTime: number, rowsAffected: number): void {
  const monitor = PerformanceMonitoringService.getInstance();
  monitor.recordQueryMetrics(query, executionTime, rowsAffected);
}