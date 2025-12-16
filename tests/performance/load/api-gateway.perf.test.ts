import request from 'supertest';
import { Express } from 'express';
import { setupTestApp } from '../../e2e/helpers/app-setup';
import { createTestUser, generateAuthToken } from '../../e2e/helpers/auth-helpers';
import { PerformanceMetrics } from '../helpers/performance-metrics';

describe('API Gateway Performance Tests', () => {
  let app: Express;
  let authTokens: string[];
  let metrics: PerformanceMetrics;

  beforeAll(async () => {
    app = await setupTestApp();
    metrics = new PerformanceMetrics();

    // Create multiple test users for load testing
    const users = await Promise.all(
      Array.from({ length: 50 }, () => createTestUser())
    );
    authTokens = users.map(user => generateAuthToken(user));
  });

  afterAll(async () => {
    metrics.generateReport('api-gateway-performance');
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting efficiently under high load', async () => {
      const requestsPerUser = 100;
      const totalRequests = authTokens.length * requestsPerUser;

      metrics.startTest('rate_limiting_load');

      const allRequests = authTokens.flatMap(token =>
        Array.from({ length: requestsPerUser }, () =>
          request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${token}`)
            .then(response => ({
              status: response.status,
              responseTime: response.get('X-Response-Time') || '0ms',
            }))
            .catch(error => ({
              status: error.status || 500,
              responseTime: '0ms',
            }))
        )
      );

      const startTime = Date.now();
      const results = await Promise.all(allRequests);
      const endTime = Date.now();

      const successfulRequests = results.filter(r => r.status === 200).length;
      const rateLimitedRequests = results.filter(r => r.status === 429).length;
      const totalTime = endTime - startTime;

      metrics.recordMetric('rate_limiting_load', {
        totalRequests,
        successfulRequests,
        rateLimitedRequests,
        totalTime,
        requestsPerSecond: totalRequests / (totalTime / 1000),
      });

      // Should handle requests efficiently
      expect(totalTime).toBeLessThan(30000); // 30 seconds max
      expect(successfulRequests + rateLimitedRequests).toBe(totalRequests);

      console.log(`✅ Rate limiting test: ${successfulRequests} success, ${rateLimitedRequests} rate limited`);
    });

    it('should maintain consistent response times under rate limiting', async () => {
      const token = authTokens[0];
      const requestCount = 200; // Exceed rate limit
      const maxResponseTime = 1000; // 1 second

      metrics.startTest('rate_limit_response_times');

      const requests = Array.from({ length: requestCount }, async (_, index) => {
        const startTime = Date.now();
        
        try {
          const response = await request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${token}`);
          
          const responseTime = Date.now() - startTime;
          return { status: response.status, responseTime, index };
        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          return { status: error.status || 500, responseTime, index };
        }
      });

      const results = await Promise.all(requests);

      const successfulRequests = results.filter(r => r.status === 200);
      const rateLimitedRequests = results.filter(r => r.status === 429);

      const averageSuccessResponseTime = successfulRequests.length > 0
        ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
        : 0;

      const averageRateLimitResponseTime = rateLimitedRequests.length > 0
        ? rateLimitedRequests.reduce((sum, r) => sum + r.responseTime, 0) / rateLimitedRequests.length
        : 0;

      metrics.recordMetric('rate_limit_response_times', {
        totalRequests: requestCount,
        successfulRequests: successfulRequests.length,
        rateLimitedRequests: rateLimitedRequests.length,
        averageSuccessResponseTime,
        averageRateLimitResponseTime,
      });

      // Rate limit responses should be fast
      expect(averageRateLimitResponseTime).toBeLessThan(maxResponseTime);
      if (successfulRequests.length > 0) {
        expect(averageSuccessResponseTime).toBeLessThan(maxResponseTime);
      }

      console.log(`✅ Rate limit response times: success ${averageSuccessResponseTime}ms, limited ${averageRateLimitResponseTime}ms`);
    });
  });

  describe('Authentication Performance', () => {
    it('should validate JWT tokens efficiently under load', async () => {
      const concurrentRequests = 500;
      const maxResponseTime = 2000; // 2 seconds

      metrics.startTest('jwt_validation_load');

      const authRequests = Array.from({ length: concurrentRequests }, (_, index) => {
        const token = authTokens[index % authTokens.length];
        
        return request(app)
          .get('/api/dashboard/numbers')
          .set('Authorization', `Bearer ${token}`)
          .then(response => ({
            status: response.status,
            authenticated: response.status !== 401,
          }))
          .catch(error => ({
            status: error.status || 500,
            authenticated: false,
          }));
      });

      const startTime = Date.now();
      const results = await Promise.all(authRequests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const authenticatedRequests = results.filter(r => r.authenticated).length;
      const averageResponseTime = totalTime / concurrentRequests;

      metrics.recordMetric('jwt_validation_load', {
        totalRequests: concurrentRequests,
        authenticatedRequests,
        totalTime,
        averageResponseTime,
        requestsPerSecond: concurrentRequests / (totalTime / 1000),
      });

      expect(totalTime).toBeLessThan(maxResponseTime);
      expect(authenticatedRequests).toBe(concurrentRequests);

      console.log(`✅ JWT validation: ${concurrentRequests} requests in ${totalTime}ms`);
    });

    it('should handle invalid tokens efficiently', async () => {
      const invalidTokens = [
        'invalid.jwt.token',
        'Bearer invalid',
        'expired.jwt.token',
        '',
        'malformed-token',
      ];

      metrics.startTest('invalid_token_handling');

      const invalidRequests = invalidTokens.map(async token => {
        const startTime = Date.now();
        
        try {
          const response = await request(app)
            .get('/api/dashboard/numbers')
            .set('Authorization', token);
          
          const responseTime = Date.now() - startTime;
          return { status: response.status, responseTime };
        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          return { status: error.status || 500, responseTime };
        }
      });

      const results = await Promise.all(invalidRequests);

      const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const unauthorizedResponses = results.filter(r => r.status === 401).length;

      metrics.recordMetric('invalid_token_handling', {
        totalRequests: invalidTokens.length,
        unauthorizedResponses,
        averageResponseTime,
      });

      // Should quickly reject invalid tokens
      expect(averageResponseTime).toBeLessThan(500); // 500ms max
      expect(unauthorizedResponses).toBe(invalidTokens.length);

      console.log(`✅ Invalid token handling: avg ${averageResponseTime}ms response time`);
    });
  });

  describe('Proxy Performance', () => {
    it('should route requests to services efficiently', async () => {
      const services = [
        '/api/numbers/search',
        '/api/dashboard/numbers',
        '/api/billing/invoices',
        '/api/notifications',
      ];

      const requestsPerService = 50;
      const maxResponseTime = 3000; // 3 seconds

      metrics.startTest('service_routing_performance');

      const routingRequests = services.flatMap(endpoint =>
        Array.from({ length: requestsPerService }, () => {
          const token = authTokens[Math.floor(Math.random() * authTokens.length)];
          
          return request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .then(response => ({
              endpoint,
              status: response.status,
              responseTime: parseInt(response.get('X-Response-Time') || '0'),
            }))
            .catch(error => ({
              endpoint,
              status: error.status || 500,
              responseTime: 0,
            }));
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(routingRequests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const successfulRequests = results.filter(r => r.status < 400).length;

      const serviceMetrics = services.map(service => {
        const serviceResults = results.filter(r => r.endpoint === service);
        const avgResponseTime = serviceResults.reduce((sum, r) => sum + r.responseTime, 0) / serviceResults.length;
        
        return {
          service,
          requests: serviceResults.length,
          averageResponseTime: avgResponseTime,
          successRate: (serviceResults.filter(r => r.status < 400).length / serviceResults.length) * 100,
        };
      });

      metrics.recordMetric('service_routing_performance', {
        totalRequests: results.length,
        successfulRequests,
        totalTime,
        serviceMetrics,
      });

      expect(totalTime).toBeLessThan(maxResponseTime);
      expect(successfulRequests / results.length).toBeGreaterThan(0.95); // 95% success rate

      console.log(`✅ Service routing: ${results.length} requests routed in ${totalTime}ms`);
    });
  });
});