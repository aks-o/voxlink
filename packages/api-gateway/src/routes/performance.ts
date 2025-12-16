import { Router } from 'express';
import { PerformanceMonitoringService } from '../middleware/performance-monitoring.middleware';
import { logger } from '../utils/logger';

export function createPerformanceRouter(): Router {
  const router = Router();
  const performanceMonitor = PerformanceMonitoringService.getInstance();

  /**
   * Get overall performance statistics
   */
  router.get('/stats', (req, res) => {
    try {
      const stats = performanceMonitor.getPerformanceStats();
      res.cache({ ttl: 60 }); // Cache for 1 minute
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get performance stats', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance statistics',
      });
    }
  });

  /**
   * Get endpoint-specific statistics
   */
  router.get('/endpoints', (req, res) => {
    try {
      const { endpoint } = req.query;
      const stats = performanceMonitor.getEndpointStats(endpoint as string);
      
      res.cache({ ttl: 60 }); // Cache for 1 minute
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get endpoint stats', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve endpoint statistics',
      });
    }
  });

  /**
   * Get slow requests
   */
  router.get('/slow-requests', (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const slowRequests = performanceMonitor.getSlowRequests(limit);
      
      res.cache({ ttl: 30 }); // Cache for 30 seconds
      res.json({
        success: true,
        data: slowRequests,
      });
    } catch (error) {
      logger.error('Failed to get slow requests', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve slow requests',
      });
    }
  });

  /**
   * Get query optimization suggestions
   */
  router.get('/query-optimization', (req, res) => {
    try {
      const suggestions = performanceMonitor.getQueryOptimizationSuggestions();
      
      res.cache({ ttl: 300 }); // Cache for 5 minutes
      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      logger.error('Failed to get query optimization suggestions', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve query optimization suggestions',
      });
    }
  });

  /**
   * Get health metrics
   */
  router.get('/health', (req, res) => {
    try {
      const healthMetrics = performanceMonitor.getHealthMetrics();
      
      // Set appropriate status code based on health
      const statusCode = healthMetrics.status === 'healthy' ? 200 :
                        healthMetrics.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json({
        success: true,
        data: healthMetrics,
      });
    } catch (error) {
      logger.error('Failed to get health metrics', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve health metrics',
      });
    }
  });

  /**
   * Reset performance metrics (admin only)
   */
  router.post('/reset', (req, res) => {
    try {
      performanceMonitor.resetMetrics();
      
      logger.info('Performance metrics reset', {
        requestedBy: req.headers['x-user-id'] || 'unknown',
      });
      
      res.json({
        success: true,
        message: 'Performance metrics have been reset',
      });
    } catch (error) {
      logger.error('Failed to reset performance metrics', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to reset performance metrics',
      });
    }
  });

  /**
   * Get performance dashboard data
   */
  router.get('/dashboard', (req, res) => {
    try {
      const stats = performanceMonitor.getPerformanceStats();
      const healthMetrics = performanceMonitor.getHealthMetrics();
      const slowRequests = performanceMonitor.getSlowRequests(5);
      const topEndpoints = performanceMonitor.getEndpointStats().slice(0, 10);

      const dashboardData = {
        overview: {
          status: healthMetrics.status,
          totalRequests: stats.totalRequests,
          averageResponseTime: stats.averageResponseTime,
          errorRate: stats.errorRate,
          uptime: stats.uptime,
        },
        performance: {
          slowRequests: stats.slowRequests,
          memoryUsage: stats.memoryUsage,
          cpuUsage: healthMetrics.cpuUsage,
        },
        endpoints: {
          topByRequests: topEndpoints.slice(0, 5),
          slowest: stats.topSlowEndpoints.slice(0, 5),
        },
        recentIssues: {
          slowRequests: slowRequests.slice(0, 3),
        },
      };

      res.cache({ ttl: 30 }); // Cache for 30 seconds
      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Failed to get dashboard data', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data',
      });
    }
  });

  /**
   * Get performance trends (last 24 hours)
   */
  router.get('/trends', (req, res) => {
    try {
      // This would typically query a time-series database
      // For now, return mock trend data
      const trends = {
        responseTime: {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          data: Array.from({ length: 24 }, () => Math.random() * 1000 + 200),
        },
        requestVolume: {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 1000) + 100),
        },
        errorRate: {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          data: Array.from({ length: 24 }, () => Math.random() * 5),
        },
      };

      res.cache({ ttl: 300 }); // Cache for 5 minutes
      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      logger.error('Failed to get performance trends', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance trends',
      });
    }
  });

  return router;
}