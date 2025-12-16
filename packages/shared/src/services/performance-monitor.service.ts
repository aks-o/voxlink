import { EventEmitter } from 'events';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface PerformanceThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  threshold: PerformanceThreshold;
  currentValue: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number; // 0-100
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    database: number;
    cache: number;
  };
  services: {
    [serviceName: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      errorRate: number;
    };
  };
  timestamp: Date;
}

export class PerformanceMonitorService extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private thresholds: PerformanceThreshold[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsRetentionPeriod = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    super();
    this.setupDefaultThresholds();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs);

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only recent metrics
    const cutoffTime = Date.now() - this.metricsRetentionPeriod;
    this.metrics.set(
      name,
      metricHistory.filter(m => m.timestamp.getTime() > cutoffTime)
    );

    // Check thresholds
    this.checkThresholds(metric);

    // Emit metric event
    this.emit('metric', metric);
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, since?: Date): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    if (since) {
      return metrics.filter(m => m.timestamp >= since);
    }
    return [...metrics];
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Get recent metrics
    const cpuMetrics = this.getMetrics('system.cpu.usage', oneMinuteAgo);
    const memoryMetrics = this.getMetrics('system.memory.usage', oneMinuteAgo);
    const diskMetrics = this.getMetrics('system.disk.usage', oneMinuteAgo);
    const networkMetrics = this.getMetrics('system.network.latency', oneMinuteAgo);
    const dbMetrics = this.getMetrics('database.response_time', oneMinuteAgo);
    const cacheMetrics = this.getMetrics('cache.hit_rate', oneMinuteAgo);

    // Calculate averages
    const avgCpu = this.calculateAverage(cpuMetrics);
    const avgMemory = this.calculateAverage(memoryMetrics);
    const avgDisk = this.calculateAverage(diskMetrics);
    const avgNetwork = this.calculateAverage(networkMetrics);
    const avgDb = this.calculateAverage(dbMetrics);
    const avgCache = this.calculateAverage(cacheMetrics);

    // Calculate health score
    const healthScore = this.calculateHealthScore({
      cpu: avgCpu,
      memory: avgMemory,
      disk: avgDisk,
      network: avgNetwork,
      database: avgDb,
      cache: avgCache,
    });

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthScore >= 80) {
      status = 'healthy';
    } else if (healthScore >= 60) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      score: healthScore,
      metrics: {
        cpu: avgCpu,
        memory: avgMemory,
        disk: avgDisk,
        network: avgNetwork,
        database: avgDb,
        cache: avgCache,
      },
      services: await this.getServiceHealth(),
      timestamp: now,
    };
  }

  /**
   * Add performance threshold
   */
  addThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit?: number): PerformanceAlert[] {
    const sortedAlerts = [...this.alerts].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? sortedAlerts.slice(0, limit) : sortedAlerts;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeRange: number = 3600000): {
    totalMetrics: number;
    activeAlerts: number;
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  } {
    const since = new Date(Date.now() - timeRange);

    const responseTimeMetrics = this.getMetrics('api.response_time', since);
    const errorMetrics = this.getMetrics('api.error_rate', since);
    const throughputMetrics = this.getMetrics('api.throughput', since);

    return {
      totalMetrics: this.getMetricNames().length,
      activeAlerts: this.getActiveAlerts().length,
      avgResponseTime: this.calculateAverage(responseTimeMetrics),
      errorRate: this.calculateAverage(errorMetrics),
      throughput: this.calculateAverage(throughputMetrics),
    };
  }

  /**
   * Setup default performance thresholds
   */
  private setupDefaultThresholds(): void {
    const defaultThresholds: PerformanceThreshold[] = [
      {
        metric: 'system.cpu.usage',
        operator: 'gt',
        value: 80,
        severity: 'high',
        description: 'High CPU usage detected',
      },
      {
        metric: 'system.memory.usage',
        operator: 'gt',
        value: 85,
        severity: 'high',
        description: 'High memory usage detected',
      },
      {
        metric: 'api.response_time',
        operator: 'gt',
        value: 1000,
        severity: 'medium',
        description: 'API response time is slow',
      },
      {
        metric: 'api.error_rate',
        operator: 'gt',
        value: 5,
        severity: 'high',
        description: 'High API error rate detected',
      },
      {
        metric: 'database.response_time',
        operator: 'gt',
        value: 500,
        severity: 'medium',
        description: 'Database response time is slow',
      },
      {
        metric: 'cache.hit_rate',
        operator: 'lt',
        value: 80,
        severity: 'medium',
        description: 'Low cache hit rate',
      },
    ];

    this.thresholds.push(...defaultThresholds);
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // CPU usage
      const cpuUsage = await this.getCPUUsage();
      this.recordMetric('system.cpu.usage', cpuUsage, 'percent');

      // Memory usage
      const memoryUsage = await this.getMemoryUsage();
      this.recordMetric('system.memory.usage', memoryUsage, 'percent');

      // Disk usage
      const diskUsage = await this.getDiskUsage();
      this.recordMetric('system.disk.usage', diskUsage, 'percent');

      // Network latency
      const networkLatency = await this.getNetworkLatency();
      this.recordMetric('system.network.latency', networkLatency, 'ms');

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Check if metric violates any thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const relevantThresholds = this.thresholds.filter(t => t.metric === metric.name);

    for (const threshold of relevantThresholds) {
      const violated = this.evaluateThreshold(metric.value, threshold);

      if (violated) {
        const alert: PerformanceAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metric: metric.name,
          threshold,
          currentValue: metric.value,
          timestamp: new Date(),
          severity: threshold.severity,
          message: `${threshold.description}: ${metric.value}${metric.unit} ${threshold.operator} ${threshold.value}${metric.unit}`,
          resolved: false,
        };

        this.alerts.push(alert);
        this.emit('alert', alert);
      }
    }
  }

  /**
   * Evaluate if a value violates a threshold
   */
  private evaluateThreshold(value: number, threshold: PerformanceThreshold): boolean {
    switch (threshold.operator) {
      case 'gt': return value > threshold.value;
      case 'lt': return value < threshold.value;
      case 'gte': return value >= threshold.value;
      case 'lte': return value <= threshold.value;
      case 'eq': return value === threshold.value;
      default: return false;
    }
  }

  /**
   * Calculate average of metrics
   */
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return Math.round((sum / metrics.length) * 100) / 100;
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    database: number;
    cache: number;
  }): number {
    const weights = {
      cpu: 0.2,
      memory: 0.2,
      disk: 0.1,
      network: 0.2,
      database: 0.2,
      cache: 0.1,
    };

    // Convert metrics to health scores (0-100)
    const scores = {
      cpu: Math.max(0, 100 - metrics.cpu),
      memory: Math.max(0, 100 - metrics.memory),
      disk: Math.max(0, 100 - metrics.disk),
      network: Math.max(0, 100 - (metrics.network / 10)), // Assume 1000ms = 0 score
      database: Math.max(0, 100 - (metrics.database / 5)), // Assume 500ms = 0 score
      cache: metrics.cache, // Cache hit rate is already a percentage
    };

    const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);

    return Math.round(weightedScore);
  }

  /**
   * Get service health status
   */
  private async getServiceHealth(): Promise<SystemHealth['services']> {
    // This would typically check actual service endpoints
    // For now, return mock data based on recent metrics
    return {
      'api-gateway': {
        status: 'up',
        responseTime: this.calculateAverage(this.getMetrics('api.response_time')),
        errorRate: this.calculateAverage(this.getMetrics('api.error_rate')),
      },
      'number-service': {
        status: 'up',
        responseTime: 150,
        errorRate: 0.5,
      },
      'billing-service': {
        status: 'up',
        responseTime: 200,
        errorRate: 0.2,
      },
      'notification-service': {
        status: 'up',
        responseTime: 100,
        errorRate: 0.1,
      },
      database: {
        status: 'up',
        responseTime: this.calculateAverage(this.getMetrics('database.response_time')),
        errorRate: 0,
      },
      redis: {
        status: 'up',
        responseTime: 5,
        errorRate: 0,
      },
    };
  }

  // System metric collection methods (would be implemented with actual system calls)
  private async getCPUUsage(): Promise<number> {
    // Mock implementation - would use actual system monitoring
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    // Mock implementation - would use actual system monitoring
    return Math.random() * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // Mock implementation - would use actual system monitoring
    return Math.random() * 100;
  }

  private async getNetworkLatency(): Promise<number> {
    // Mock implementation - would ping actual endpoints
    return Math.random() * 200;
  }

  /**
   * Get system metrics for SystemHealthService compatibility
   */
  async getSystemMetrics(): Promise<{
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    throughput: {
      callsPerMinute: number;
      messagesPerMinute: number;
      apiRequestsPerMinute: number;
    };
  }> {
    const health = await this.getSystemHealth();

    // Get throughput metrics
    const throughputMetrics = this.getMetrics('api.throughput');
    const apiThroughput = this.calculateAverage(throughputMetrics);

    return {
      cpuUsage: health.metrics.cpu,
      memoryUsage: health.metrics.memory,
      diskUsage: health.metrics.disk,
      networkLatency: health.metrics.network,
      throughput: {
        callsPerMinute: 0, // Placeholder
        messagesPerMinute: 0, // Placeholder
        apiRequestsPerMinute: apiThroughput || 0,
      }
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitorService();