import request from 'supertest';
import { Express } from 'express';
import { setupTestApp } from '../../e2e/helpers/app-setup';
import { createTestUser, generateAuthToken } from '../../e2e/helpers/auth-helpers';
import { PerformanceMetrics } from '../helpers/performance-metrics';

describe('Number Search Performance Tests', () => {
  let app: Express;
  let authToken: string;
  let metrics: PerformanceMetrics;

  beforeAll(async () => {
    app = await setupTestApp();
    const user = await createTestUser();
    authToken = generateAuthToken(user);
    metrics = new PerformanceMetrics();
  });

  afterAll(async () => {
    metrics.generateReport('number-search-performance');
  });

  describe('Search API Load Testing', () => {
    it('should handle 100 concurrent search requests within acceptable time', async () => {
      const concurrentRequests = 100;
      const maxResponseTime = 5000; // 5 seconds
      const maxAverageResponseTime = 3000; // 3 seconds

      metrics.startTest('concurrent_search_100');

      const searchPromises = Array.from({ length: concurrentRequests }, (_, index) =>
        request(app)
          .get('/api/numbers/search')
          .query({
            country: 'US',
            areaCode: '555',
            pattern: `555-${index.toString().padStart(3, '0')}-****`,
          })
          .set('Authorization', `Bearer ${authToken}`)
          .then(response => {
            expect(response.status).toBe(200);
            expect(response.body.numbers).toHaveLength(10);
            return response;
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(searchPromises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / concurrentRequests;

      metrics.recordMetric('concurrent_search_100', {
        totalRequests: concurrentRequests,
        totalTime,
        averageResponseTime,
        successfulRequests: responses.length,
        failedRequests: concurrentRequests - responses.length,
      });

      expect(totalTime).toBeLessThan(maxResponseTime);
      expect(averageResponseTime).toBeLessThan(maxAverageResponseTime);

      console.log(`✅ 100 concurrent searches completed in ${totalTime}ms (avg: ${averageResponseTime}ms)`);
    });

    it('should maintain performance under sustained load', async () => {
      const requestsPerSecond = 10;
      const durationSeconds = 30;
      const totalRequests = requestsPerSecond * durationSeconds;
      const maxResponseTime = 3000;

      metrics.startTest('sustained_load_search');

      const results: Array<{ responseTime: number; success: boolean }> = [];
      const startTime = Date.now();

      for (let second = 0; second < durationSeconds; second++) {
        const batchPromises = Array.from({ length: requestsPerSecond }, async () => {
          const requestStart = Date.now();
          
          try {
            const response = await request(app)
              .get('/api/numbers/search')
              .query({
                country: 'US',
                areaCode: Math.floor(Math.random() * 900 + 100).toString(),
              })
              .set('Authorization', `Bearer ${authToken}`);

            const responseTime = Date.now() - requestStart;
            
            return {
              responseTime,
              success: response.status === 200,
            };
          } catch (error) {
            return {
              responseTime: Date.now() - requestStart,
              success: false,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Wait for the next second
        const elapsedTime = Date.now() - startTime;
        const targetTime = (second + 1) * 1000;
        if (elapsedTime < targetTime) {
          await new Promise(resolve => setTimeout(resolve, targetTime - elapsedTime));
        }
      }

      const successfulRequests = results.filter(r => r.success).length;
      const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const maxResponseTimeActual = Math.max(...results.map(r => r.responseTime));
      const successRate = (successfulRequests / totalRequests) * 100;

      metrics.recordMetric('sustained_load_search', {
        totalRequests,
        successfulRequests,
        failedRequests: totalRequests - successfulRequests,
        averageResponseTime,
        maxResponseTime: maxResponseTimeActual,
        successRate,
        durationSeconds,
      });

      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(averageResponseTime).toBeLessThan(maxResponseTime);
      expect(maxResponseTimeActual).toBeLessThan(maxResponseTime * 2); // Allow some outliers

      console.log(`✅ Sustained load test: ${successRate}% success rate, avg response: ${averageResponseTime}ms`);
    });

    it('should handle search with complex filters efficiently', async () => {
      const complexSearches = [
        {
          country: 'US',
          areaCode: '555',
          pattern: '555-123-****',
          features: ['sms', 'voice', 'fax'],
          priceRange: { min: 5, max: 50 },
        },
        {
          country: 'CA',
          region: 'Ontario',
          pattern: '*-*-1234',
          features: ['voice'],
          priceRange: { min: 10, max: 30 },
        },
        {
          country: 'UK',
          city: 'London',
          pattern: '+44-20-****-****',
          features: ['sms', 'voice'],
        },
      ];

      metrics.startTest('complex_search_filters');

      const searchPromises = complexSearches.map(async (searchParams, index) => {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/numbers/search')
          .query(searchParams)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const responseTime = Date.now() - startTime;
        
        expect(response.body.numbers).toBeDefined();
        expect(responseTime).toBeLessThan(5000); // 5 seconds max for complex searches
        
        return { searchParams, responseTime, resultCount: response.body.numbers.length };
      });

      const results = await Promise.all(searchPromises);

      const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      metrics.recordMetric('complex_search_filters', {
        totalSearches: results.length,
        averageResponseTime,
        results: results.map(r => ({
          responseTime: r.responseTime,
          resultCount: r.resultCount,
        })),
      });

      expect(averageResponseTime).toBeLessThan(3000); // 3 seconds average

      console.log(`✅ Complex searches completed with avg response: ${averageResponseTime}ms`);
    });
  });

  describe('Search Caching Performance', () => {
    it('should improve response times with caching', async () => {
      const searchQuery = {
        country: 'US',
        areaCode: '555',
        pattern: '555-999-****',
      };

      metrics.startTest('search_caching');

      // First request (cache miss)
      const firstRequestStart = Date.now();
      const firstResponse = await request(app)
        .get('/api/numbers/search')
        .query(searchQuery)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const firstRequestTime = Date.now() - firstRequestStart;

      // Second request (cache hit)
      const secondRequestStart = Date.now();
      const secondResponse = await request(app)
        .get('/api/numbers/search')
        .query(searchQuery)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const secondRequestTime = Date.now() - secondRequestStart;

      // Third request (cache hit)
      const thirdRequestStart = Date.now();
      const thirdResponse = await request(app)
        .get('/api/numbers/search')
        .query(searchQuery)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const thirdRequestTime = Date.now() - thirdRequestStart;

      metrics.recordMetric('search_caching', {
        firstRequestTime,
        secondRequestTime,
        thirdRequestTime,
        cacheImprovement: ((firstRequestTime - secondRequestTime) / firstRequestTime) * 100,
      });

      // Cache should improve response time by at least 50%
      expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.5);
      expect(thirdRequestTime).toBeLessThan(firstRequestTime * 0.5);

      // Results should be identical
      expect(secondResponse.body).toEqual(firstResponse.body);
      expect(thirdResponse.body).toEqual(firstResponse.body);

      console.log(`✅ Cache improved response time: ${firstRequestTime}ms → ${secondRequestTime}ms`);
    });
  });
});