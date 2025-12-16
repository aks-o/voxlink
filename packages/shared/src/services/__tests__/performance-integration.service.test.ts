import { PerformanceIntegrationService } from '../performance-integration.service';
import { CacheService } from '../cache.service';
import { CDNService } from '../cdn.service';
import { performanceMonitor } from '../performance-monitor.service';
import { autoScalingService } from '../auto-scaling.service';
import { circuitBreakerService } from '../circuit-breaker.service';

// Mock all dependencies
jest.mock('../cache.service');
jest.mock('../cdn.service');
jest.mock('../performance-monitor.service');
jest.mock('../auto-scaling.service');
jest.mock('../circuit-breaker.service');

const mockCacheService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getStats: jest.fn(),
  isHealthy: jest.fn(),
  getPerformanceMetrics: jest.fn(),
};

const mockCDNService = {
  getAnalytics: jest.fn(),
};

const mockPerformanceMonitor = {
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  getSystemHealth: jest.fn(),
  addThreshold: jest.fn(),
  recordMetric: jest.fn(),
};

const mockAutoScalingService = {
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  registerService: jest.fn(),
  addScalingRule: jest.fn(),
  getScalingStats: jest.fn(),
};

const mockCircuitBreakerService = {
  getAllStats: jest.fn(),
  getHealthStatus: jest.fn(),
  on: jest.fn(),
};

// Mock constructors
(CacheService as jest.Mock).mockImplementation(() => mockCacheService);
(CDNService as jest.Mock).mockImplementation(() => mockCDNService);

// Mock singletons
Object.assign(performanceMonitor, mockPerformanceMonitor);
Object.assign(autoScalingService, mockAutoScalingService);
Object.assign(circuitBreakerService, mockCircuitBreakerService);

describe('PerformanceIntegrationService', () => {
  let service: PerformanceIntegrationService;
  let config: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    config = {
      cache: {
        enabled: true,
        host: 'localhost',
        port: 6379,
        keyPrefix: 'test:',
        defaultTtl: 3600,
      },
      cdn: {
        enabled: true,
        provider: 'cloudflare',
        baseUrl: 'https://cdn.test.com',
        apiKey: 'test-key',
      },
      monitoring: {
        enabled: true,
        metricsInterval: 30000,
        alertThresholds: {
          responseTime: 2000,
          errorRate: 5,
          cpuUsage: 80,
          memoryUsage: 85,
        },
      },
      autoScaling: {
        enabled: true,
        monitoringInterval: 60000,
        defaultRules: true,
      },
      circuitBreaker: {
        enabled: true,
        defaultConfig: {
          failureThreshold: 5,
          recoveryTimeout: 60000,
          monitoringPeriod: 60000,
        },
      },
      queryOptimization: {
        enabled: true,
        slowQueryThreshold: 1000,
        autoIndexSuggestions: true,
      },
    };

    service = new PerformanceIntegrationService(config);
  });

  describe('initialize', () => {
    it('should initialize all enabled services', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      mockPerformanceMonitor.getSystemHealth.mockResolvedValue({
        status: 'healthy',
        score: 85,
        metrics: { cpu: 50, memory: 60, disk: 40, network: 20, database: 30, cache: 80 },
        services: {},
        timestamp: new Date(),
      });

      await service.initialize();

      expect(mockCacheService.connect).toHaveBeenCalled();
      expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalledWith(30000);
      expect(mockAutoScalingService.startMonitoring).toHaveBeenCalledWith(60000);
      expect(mockPerformanceMonitor.addThreshold).toHaveBeenCalledTimes(4);
    });

    it('should skip disabled services', async () => {
      config.cache.enabled = false;
      config.cdn.enabled = false;
      config.monitoring.enabled = false;
      config.autoScaling.enabled = false;
      config.circuitBreaker.enabled = false;

      service = new PerformanceIntegrationService(config);
      await service.initialize();

      expect(mockCacheService.connect).not.toHaveBeenCalled();
      expect(mockPerformanceMonitor.startMonitoring).not.toHaveBeenCalled();
      expect(mockAutoScalingService.startMonitoring).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockCacheService.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(service.initialize()).rejects.toThrow('Connection failed');
    });

    it('should emit initialized event', async () => {
      const initSpy = jest.fn();
      service.on('initialized', initSpy);

      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should shutdown all services', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.disconnect.mockResolvedValue(undefined);
      await service.shutdown();

      expect(mockCacheService.disconnect).toHaveBeenCalled();
      expect(mockPerformanceMonitor.stopMonitoring).toHaveBeenCalled();
      expect(mockAutoScalingService.stopMonitoring).toHaveBeenCalled();
    });

    it('should emit shutdown event', async () => {
      const shutdownSpy = jest.fn();
      service.on('shutdown', shutdownSpy);

      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.disconnect.mockResolvedValue(undefined);
      await service.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });

    it('should handle shutdown errors', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(service.shutdown()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('getPerformanceReport', () => {
    beforeEach(async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should generate comprehensive performance report', async () => {
      // Mock all required data
      mockPerformanceMonitor.getSystemHealth.mockResolvedValue({
        status: 'healthy',
        score: 85,
        metrics: { cpu: 50, memory: 60, disk: 40, network: 20, database: 30, cache: 80 },
        services: {},
        timestamp: new Date(),
      });

      mockCacheService.getStats.mockReturnValue({
        hits: 800,
        misses: 200,
        sets: 100,
        deletes: 10,
        errors: 5,
        hitRate: 80,
      });

      mockCacheService.getPerformanceMetrics.mockResolvedValue({
        avgResponseTime: 50,
        throughput: 1000,
        errorRate: 0.5,
        memoryUsage: 1024,
      });

      mockAutoScalingService.getScalingStats.mockReturnValue({
        totalServices: 4,
        totalInstances: 8,
        healthyInstances: 7,
        unhealthyInstances: 1,
        recentScalingActions: 2,
        avgResponseTime: 200,
        avgCpuUsage: 60,
        avgMemoryUsage: 70,
      });

      mockCircuitBreakerService.getAllStats.mockReturnValue({
        'api-gateway': {
          state: 'CLOSED',
          failureCount: 0,
          successCount: 100,
          totalRequests: 100,
          errorRate: 0,
          lastFailureTime: undefined,
          lastSuccessTime: new Date(),
          nextAttemptTime: undefined,
        },
      });

      mockCDNService.getAnalytics.mockResolvedValue({
        requests: 10000,
        bandwidth: 1000000,
        cacheHitRate: 95,
        topAssets: [],
      });

      const report = await service.getPerformanceReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('overall');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('services');
      expect(report).toHaveProperty('optimizations');

      expect(report.overall.status).toBe('healthy');
      expect(report.overall.score).toBe(85);
      expect(report.metrics.cache.hitRate).toBe(80);
      expect(report.services['api-gateway'].status).toBe('up');
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new PerformanceIntegrationService(config);

      await expect(uninitializedService.getPerformanceReport()).rejects.toThrow(
        'Performance integration service not initialized'
      );
    });
  });

  describe('optimizePerformance', () => {
    beforeEach(async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should apply performance optimizations', async () => {
      mockCacheService.getStats.mockReturnValue({
        hits: 400,
        misses: 600,
        sets: 100,
        deletes: 10,
        errors: 5,
        hitRate: 40, // Low hit rate
      });

      const queryOptimizer = service.getQueryOptimizer();
      jest.spyOn(queryOptimizer, 'suggestIndexes').mockReturnValue([
        {
          table: 'users',
          columns: ['email'],
          type: 'btree',
          reason: 'Frequent WHERE clause on email',
          estimatedImprovement: 50,
        },
      ]);

      jest.spyOn(queryOptimizer, 'generateIndexMigrations').mockReturnValue([
        'CREATE INDEX CONCURRENTLY idx_users_email ON users (email);',
      ]);

      mockAutoScalingService.getScalingStats.mockReturnValue({
        totalServices: 4,
        totalInstances: 8,
        healthyInstances: 6,
        unhealthyInstances: 2, // Has unhealthy instances
        recentScalingActions: 0,
        avgResponseTime: 200,
        avgCpuUsage: 60,
        avgMemoryUsage: 70,
      });

      const result = await service.optimizePerformance();

      expect(result.applied.length).toBeGreaterThan(0);
      expect(result.scheduled.length).toBeGreaterThan(0);
      expect(result.failed).toEqual([]);
    });

    it('should handle optimization failures gracefully', async () => {
      // Mock services to throw errors
      mockCacheService.getStats.mockImplementation(() => {
        throw new Error('Cache error');
      });

      const result = await service.optimizePerformance();

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.failed).toContain('Cache optimization failed');
    });

    it('should emit optimization completed event', async () => {
      const optimizationSpy = jest.fn();
      service.on('optimizationCompleted', optimizationSpy);

      mockCacheService.getStats.mockReturnValue({
        hits: 800,
        misses: 200,
        sets: 100,
        deletes: 10,
        errors: 0,
        hitRate: 80,
      });

      mockAutoScalingService.getScalingStats.mockReturnValue({
        totalServices: 4,
        totalInstances: 8,
        healthyInstances: 8,
        unhealthyInstances: 0,
        recentScalingActions: 0,
        avgResponseTime: 200,
        avgCpuUsage: 60,
        avgMemoryUsage: 70,
      });

      await service.optimizePerformance();

      expect(optimizationSpy).toHaveBeenCalled();
    });
  });

  describe('isHealthy', () => {
    it('should return false when not initialized', async () => {
      const result = await service.isHealthy();
      expect(result).toBe(false);
    });

    it('should return true when all services are healthy', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.isHealthy.mockReturnValue(true);
      mockPerformanceMonitor.getSystemHealth.mockResolvedValue({
        status: 'healthy',
        score: 85,
      });
      mockCircuitBreakerService.getHealthStatus.mockReturnValue({
        healthy: ['service1', 'service2'],
        degraded: [],
        unhealthy: [],
        totalCircuits: 2,
      });

      const result = await service.isHealthy();
      expect(result).toBe(true);
    });

    it('should return false when cache is unhealthy', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.isHealthy.mockReturnValue(false);

      const result = await service.isHealthy();
      expect(result).toBe(false);
    });

    it('should return false when system health is unhealthy', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.isHealthy.mockReturnValue(true);
      mockPerformanceMonitor.getSystemHealth.mockResolvedValue({
        status: 'unhealthy',
        score: 30,
      });

      const result = await service.isHealthy();
      expect(result).toBe(false);
    });

    it('should return false when circuit breakers are mostly unhealthy', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.isHealthy.mockReturnValue(true);
      mockPerformanceMonitor.getSystemHealth.mockResolvedValue({
        status: 'healthy',
        score: 85,
      });
      mockCircuitBreakerService.getHealthStatus.mockReturnValue({
        healthy: ['service1'],
        degraded: [],
        unhealthy: ['service2', 'service3'],
        totalCircuits: 3,
      });

      const result = await service.isHealthy();
      expect(result).toBe(false);
    });

    it('should handle health check errors', async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();

      mockCacheService.isHealthy.mockImplementation(() => {
        throw new Error('Health check failed');
      });

      const result = await service.isHealthy();
      expect(result).toBe(false);
    });
  });

  describe('service getters', () => {
    beforeEach(async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should return cache service instance', () => {
      const cacheService = service.getCacheService();
      expect(cacheService).toBeDefined();
    });

    it('should return CDN service instance', () => {
      const cdnService = service.getCDNService();
      expect(cdnService).toBeDefined();
    });

    it('should return query optimizer instance', () => {
      const queryOptimizer = service.getQueryOptimizer();
      expect(queryOptimizer).toBeDefined();
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      mockCacheService.connect.mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should handle circuit breaker state changes', () => {
      const stateChangeSpy = jest.fn();
      service.on('circuitBreakerStateChange', stateChangeSpy);

      // Simulate circuit breaker state change
      const stateChangeCallback = mockCircuitBreakerService.on.mock.calls.find(
        call => call[0] === 'stateChange'
      )[1];

      stateChangeCallback('test-service', 'OPEN', 'CLOSED');

      expect(stateChangeSpy).toHaveBeenCalledWith('test-service', 'OPEN', 'CLOSED');
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith(
        'circuit_breaker.state_change',
        1,
        'count',
        { service: 'test-service', newState: 'OPEN', previousState: 'CLOSED' }
      );
    });

    it('should handle circuit breaker failures', () => {
      // Simulate circuit breaker failure
      const failureCallback = mockCircuitBreakerService.on.mock.calls.find(
        call => call[0] === 'failure'
      )[1];

      const error = new Error('Service failed');
      failureCallback('test-service', error);

      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith(
        'circuit_breaker.failure',
        1,
        'count',
        { service: 'test-service' }
      );
    });
  });
});