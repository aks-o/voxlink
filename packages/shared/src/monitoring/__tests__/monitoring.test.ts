import { 
  createLogger, 
  VoxLinkError, 
  createError,
  HealthCheckManager,
  commonHealthChecks,
  MetricsCollector
} from '../index';

describe('Monitoring System', () => {
  describe('Logger', () => {
    it('should create a logger with service name', () => {
      const logger = createLogger('test-service');
      expect(logger).toBeDefined();
    });

    it('should log structured messages', () => {
      const logger = createLogger('test-service');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test message', { userId: '123', action: 'test' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log performance metrics', () => {
      const logger = createLogger('test-service');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.logPerformance({
        operation: 'test-operation',
        duration: 100,
        success: true
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log business metrics', () => {
      const logger = createLogger('test-service');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.logBusinessMetric({
        metric: 'user_registrations',
        value: 1,
        tags: { source: 'web' }
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log security events', () => {
      const logger = createLogger('test-service');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.logSecurityEvent({
        event: 'failed_login',
        severity: 'medium',
        userId: '123',
        details: { attempts: 3 }
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should create VoxLinkError with correct properties', () => {
      const error = new VoxLinkError('Test error', 400, 'TEST_ERROR', { field: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.isOperational).toBe(true);
    });

    it('should create validation error', () => {
      const error = createError.validation('Invalid input', { field: 'email' });
      
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create not found error', () => {
      const error = createError.notFound('User', '123');
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe("User with identifier '123' not found");
    });

    it('should create unauthorized error', () => {
      const error = createError.unauthorized();
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create service unavailable error', () => {
      const error = createError.serviceUnavailable('database');
      
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('database service is currently unavailable');
    });
  });

  describe('Health Check Manager', () => {
    let healthManager: HealthCheckManager;

    beforeEach(() => {
      healthManager = new HealthCheckManager('test-service');
    });

    it('should register health checks', () => {
      const mockCheck = jest.fn().mockResolvedValue({
        name: 'test',
        status: 'healthy' as const,
        responseTime: 100
      });

      healthManager.register('test', mockCheck);
      expect(healthManager['checks'].has('test')).toBe(true);
    });

    it('should run health checks', async () => {
      const mockCheck = jest.fn().mockResolvedValue({
        name: 'test',
        status: 'healthy' as const,
        responseTime: 100
      });

      healthManager.register('test', mockCheck);
      const results = await healthManager.runChecks();

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test');
      expect(results[0].status).toBe('healthy');
      expect(mockCheck).toHaveBeenCalled();
    });

    it('should handle health check failures', async () => {
      const mockCheck = jest.fn().mockRejectedValue(new Error('Check failed'));

      healthManager.register('test', mockCheck);
      const results = await healthManager.runChecks();

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test');
      expect(results[0].status).toBe('unhealthy');
      expect(results[0].error).toBe('Check failed');
    });

    it('should get system health', async () => {
      const mockCheck = jest.fn().mockResolvedValue({
        name: 'test',
        status: 'healthy' as const,
        responseTime: 100
      });

      healthManager.register('test', mockCheck);
      const systemHealth = await healthManager.getSystemHealth();

      expect(systemHealth.status).toBe('healthy');
      expect(systemHealth.checks).toHaveLength(1);
      expect(systemHealth.uptime).toBeGreaterThan(0);
      expect(systemHealth.system.memory).toBeDefined();
    });
  });

  describe('Common Health Checks', () => {
    it('should create memory health check', async () => {
      const memoryCheck = commonHealthChecks.memory(1024);
      const result = await memoryCheck();

      expect(result.name).toBe('memory');
      expect(result.status).toMatch(/healthy|degraded/);
      expect(result.details.heapUsedMB).toBeGreaterThan(0);
    });

    it('should create database health check', async () => {
      const mockConnectionTest = jest.fn().mockResolvedValue(true);
      const dbCheck = commonHealthChecks.database(mockConnectionTest);
      const result = await dbCheck();

      expect(result.name).toBe('database');
      expect(result.status).toBe('healthy');
      expect(mockConnectionTest).toHaveBeenCalled();
    });

    it('should create redis health check', async () => {
      const mockPingTest = jest.fn().mockResolvedValue(true);
      const redisCheck = commonHealthChecks.redis(mockPingTest);
      const result = await redisCheck();

      expect(result.name).toBe('redis');
      expect(result.status).toBe('healthy');
      expect(mockPingTest).toHaveBeenCalled();
    });

    it('should create custom health check', async () => {
      const mockCheckFn = jest.fn().mockResolvedValue({ 
        healthy: true, 
        details: { status: 'ok' } 
      });
      const customCheck = commonHealthChecks.custom('custom-check', mockCheckFn);
      const result = await customCheck();

      expect(result.name).toBe('custom-check');
      expect(result.status).toBe('healthy');
      expect(result.details).toEqual({ status: 'ok' });
      expect(mockCheckFn).toHaveBeenCalled();
    });
  });

  describe('Metrics Collector', () => {
    let metrics: MetricsCollector;

    beforeEach(() => {
      metrics = new MetricsCollector('test-service');
    });

    it('should increment counters', () => {
      metrics.increment('test_counter');
      metrics.increment('test_counter');
      
      const allMetrics = metrics.getMetrics();
      expect(allMetrics['test_counter']).toBe(2);
    });

    it('should set gauge values', () => {
      metrics.gauge('test_gauge', 42);
      
      const allMetrics = metrics.getMetrics();
      expect(allMetrics['test_gauge']).toBe(42);
    });

    it('should record histogram values', () => {
      metrics.histogram('test_histogram', 100);
      metrics.histogram('test_histogram', 200);
      
      const allMetrics = metrics.getMetrics();
      expect(allMetrics['test_histogram']).toEqual([100, 200]);
    });

    it('should handle metrics with tags', () => {
      metrics.increment('test_counter', { method: 'GET', status: '200' });
      
      const allMetrics = metrics.getMetrics();
      expect(allMetrics['test_counter{method=GET,status=200}']).toBe(1);
    });

    it('should clear all metrics', () => {
      metrics.increment('test_counter');
      metrics.gauge('test_gauge', 42);
      
      metrics.clear();
      
      const allMetrics = metrics.getMetrics();
      expect(Object.keys(allMetrics)).toHaveLength(0);
    });
  });
});