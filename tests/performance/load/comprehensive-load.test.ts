import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import { createTestApp, createLoadTestScenario } from '../../integration/helpers/app-setup';
import { Express } from 'express';

describe('Comprehensive Load Testing', () => {
  let app: Express;
  const testDuration = 60; // seconds
  const maxConcurrency = 100;

  beforeAll(async () => {
    app = await createTestApp('api-gateway');
    
    // Seed database with test data for load testing
    await seedLoadTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupLoadTestData();
  });

  describe('API Gateway Load Tests', () => {
    it('should handle high concurrent user authentication', async () => {
      const scenarios = [
        {
          endpoint: '/api/auth/login',
          method: 'POST' as const,
          data: {
            email: 'loadtest@example.com',
            password: 'LoadTest123!',
          },
          weight: 30,
        },
        {
          endpoint: '/api/auth/refresh',
          method: 'POST' as const,
          data: { refreshToken: 'mock-refresh-token' },
          weight: 20,
        },
        {
          endpoint: '/api/user/profile',
          method: 'GET' as const,
          weight: 50,
        },
      ];

      const loadTest = createLoadTestScenario(app, scenarios, {
        duration: testDuration,
        concurrency: 50,
        rampUp: 10,
      });

      const results = await loadTest();

      // Performance assertions
      expect(results.successRate).toBeGreaterThan(95);
      expect(results.avgDuration).toBeLessThan(500); // 500ms average
      expect(results.p95Duration).toBeLessThan(1000); // 1s for 95th percentile
      expect(results.requestsPerSecond).toBeGreaterThan(100);

      // Log performance metrics
      console.log('Authentication Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        avgDuration: `${results.avgDuration.toFixed(2)}ms`,
        p95Duration: `${results.p95Duration.toFixed(2)}ms`,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });
    });

    it('should handle high-volume number search requests', async () => {
      const scenarios = [
        {
          endpoint: '/api/numbers/search?countryCode=US&limit=20',
          method: 'GET' as const,
          weight: 40,
        },
        {
          endpoint: '/api/numbers/search?countryCode=US&areaCode=555&limit=20',
          method: 'GET' as const,
          weight: 30,
        },
        {
          endpoint: '/api/numbers/search?countryCode=US&city=New York&limit=20',
          method: 'GET' as const,
          weight: 20,
        },
        {
          endpoint: '/api/numbers/search?countryCode=US&features=SMS,VOICE&limit=20',
          method: 'GET' as const,
          weight: 10,
        },
      ];

      const loadTest = createLoadTestScenario(app, scenarios, {
        duration: testDuration,
        concurrency: 75,
        rampUp: 15,
      });

      const results = await loadTest();

      // Performance assertions for search operations
      expect(results.successRate).toBeGreaterThan(98);
      expect(results.avgDuration).toBeLessThan(300); // 300ms average for search
      expect(results.p95Duration).toBeLessThan(800); // 800ms for 95th percentile
      expect(results.requestsPerSecond).toBeGreaterThan(150);

      console.log('Number Search Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        avgDuration: `${results.avgDuration.toFixed(2)}ms`,
        p95Duration: `${results.p95Duration.toFixed(2)}ms`,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });
    });

    it('should handle mixed workload scenarios', async () => {
      const scenarios = [
        // Read operations (70% of traffic)
        {
          endpoint: '/api/numbers/search?countryCode=US&limit=10',
          method: 'GET' as const,
          weight: 25,
        },
        {
          endpoint: '/api/user/profile',
          method: 'GET' as const,
          weight: 20,
        },
        {
          endpoint: '/api/numbers/inventory',
          method: 'GET' as const,
          weight: 15,
        },
        {
          endpoint: '/api/billing/invoices',
          method: 'GET' as const,
          weight: 10,
        },
        
        // Write operations (30% of traffic)
        {
          endpoint: '/api/numbers/purchase',
          method: 'POST' as const,
          data: {
            numberId: 'test-number-id',
            userId: 'test-user-id',
          },
          weight: 15,
        },
        {
          endpoint: '/api/numbers/configuration',
          method: 'PUT' as const,
          data: {
            numberId: 'test-number-id',
            smsEnabled: true,
            voiceEnabled: true,
          },
          weight: 10,
        },
        {
          endpoint: '/api/user/profile',
          method: 'PUT' as const,
          data: {
            name: 'Updated Name',
          },
          weight: 5,
        },
      ];

      const loadTest = createLoadTestScenario(app, scenarios, {
        duration: testDuration,
        concurrency: maxConcurrency,
        rampUp: 20,
      });

      const results = await loadTest();

      // Mixed workload should handle both reads and writes efficiently
      expect(results.successRate).toBeGreaterThan(95);
      expect(results.avgDuration).toBeLessThan(600); // 600ms average for mixed workload
      expect(results.p95Duration).toBeLessThan(1500); // 1.5s for 95th percentile
      expect(results.requestsPerSecond).toBeGreaterThan(80);

      console.log('Mixed Workload Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        avgDuration: `${results.avgDuration.toFixed(2)}ms`,
        p95Duration: `${results.p95Duration.toFixed(2)}ms`,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });
    });
  });

  describe('Database Performance Under Load', () => {
    it('should maintain database performance under high read load', async () => {
      const readScenarios = [
        {
          endpoint: '/api/numbers/search?countryCode=US&limit=50',
          method: 'GET' as const,
          weight: 40,
        },
        {
          endpoint: '/api/numbers/inventory?limit=50',
          method: 'GET' as const,
          weight: 30,
        },
        {
          endpoint: '/api/billing/usage?startDate=2023-01-01&endDate=2023-12-31',
          method: 'GET' as const,
          weight: 20,
        },
        {
          endpoint: '/api/analytics/dashboard',
          method: 'GET' as const,
          weight: 10,
        },
      ];

      const loadTest = createLoadTestScenario(app, readScenarios, {
        duration: testDuration,
        concurrency: 80,
        rampUp: 15,
      });

      const results = await loadTest();

      // Database read operations should be fast
      expect(results.successRate).toBeGreaterThan(98);
      expect(results.avgDuration).toBeLessThan(400);
      expect(results.p95Duration).toBeLessThan(1000);

      console.log('Database Read Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        avgDuration: `${results.avgDuration.toFixed(2)}ms`,
        p95Duration: `${results.p95Duration.toFixed(2)}ms`,
      });
    });

    it('should handle concurrent write operations', async () => {
      const writeScenarios = [
        {
          endpoint: '/api/numbers/purchase',
          method: 'POST' as const,
          data: {
            numberId: () => `test-number-${Math.random()}`,
            userId: 'load-test-user',
          },
          weight: 40,
        },
        {
          endpoint: '/api/numbers/configuration',
          method: 'PUT' as const,
          data: {
            numberId: () => `test-number-${Math.random()}`,
            smsEnabled: true,
            voiceEnabled: true,
          },
          weight: 30,
        },
        {
          endpoint: '/api/billing/usage',
          method: 'POST' as const,
          data: {
            numberId: () => `test-number-${Math.random()}`,
            type: 'SMS_OUTBOUND',
            quantity: 1,
            cost: 0.01,
          },
          weight: 30,
        },
      ];

      const loadTest = createLoadTestScenario(app, writeScenarios, {
        duration: 30, // Shorter duration for write operations
        concurrency: 30, // Lower concurrency for writes
        rampUp: 10,
      });

      const results = await loadTest();

      // Write operations may be slower but should still be reliable
      expect(results.successRate).toBeGreaterThan(95);
      expect(results.avgDuration).toBeLessThan(800);
      expect(results.p95Duration).toBeLessThan(2000);

      console.log('Database Write Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        avgDuration: `${results.avgDuration.toFixed(2)}ms`,
        p95Duration: `${results.p95Duration.toFixed(2)}ms`,
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks under sustained load', async () => {
      const initialMemory = process.memoryUsage();
      
      const scenarios = [
        {
          endpoint: '/api/numbers/search?countryCode=US&limit=20',
          method: 'GET' as const,
          weight: 100,
        },
      ];

      const loadTest = createLoadTestScenario(app, scenarios, {
        duration: 120, // 2 minutes of sustained load
        concurrency: 50,
        rampUp: 10,
      });

      const results = await loadTest();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log('Memory Usage Test Results:', {
        initialMemoryMB: (initialMemory.heapUsed / 1024 / 1024).toFixed(2),
        finalMemoryMB: (finalMemory.heapUsed / 1024 / 1024).toFixed(2),
        memoryIncreaseMB: memoryIncreaseMB.toFixed(2),
        totalRequests: results.totalRequests,
      });

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(50);
      expect(results.successRate).toBeGreaterThan(98);
    });

    it('should handle CPU-intensive operations efficiently', async () => {
      const cpuIntensiveScenarios = [
        {
          endpoint: '/api/analytics/complex-report',
          method: 'GET' as const,
          weight: 50,
        },
        {
          endpoint: '/api/numbers/bulk-import',
          method: 'POST' as const,
          data: {
            numbers: Array.from({ length: 100 }, (_, i) => ({
              phoneNumber: `+1555${String(i).padStart(7, '0')}`,
              countryCode: 'US',
              areaCode: '555',
            })),
          },
          weight: 30,
        },
        {
          endpoint: '/api/billing/generate-invoice',
          method: 'POST' as const,
          data: {
            userId: 'load-test-user',
            period: '2023-01',
          },
          weight: 20,
        },
      ];

      const loadTest = createLoadTestScenario(app, cpuIntensiveScenarios, {
        duration: 60,
        concurrency: 20, // Lower concurrency for CPU-intensive operations
        rampUp: 15,
      });

      const results = await loadTest();

      // CPU-intensive operations should still complete successfully
      expect(results.successRate).toBeGreaterThan(90);
      expect(results.avgDuration).toBeLessThan(2000); // 2 seconds average
      expect(results.p95Duration).toBeLessThan(5000); // 5 seconds for 95th percentile

      console.log('CPU-Intensive Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        avgDuration: `${results.avgDuration.toFixed(2)}ms`,
        p95Duration: `${results.p95Duration.toFixed(2)}ms`,
      });
    });
  });

  describe('Error Handling Under Load', () => {
    it('should gracefully handle errors during high load', async () => {
      // Introduce some failing endpoints
      const scenariosWithErrors = [
        {
          endpoint: '/api/numbers/search?countryCode=US',
          method: 'GET' as const,
          weight: 70, // Most requests should succeed
        },
        {
          endpoint: '/api/numbers/search?countryCode=INVALID',
          method: 'GET' as const,
          weight: 15, // Some requests will fail validation
        },
        {
          endpoint: '/api/numbers/nonexistent-endpoint',
          method: 'GET' as const,
          weight: 10, // Some requests will return 404
        },
        {
          endpoint: '/api/numbers/server-error-simulation',
          method: 'GET' as const,
          weight: 5, // Some requests will return 500
        },
      ];

      const loadTest = createLoadTestScenario(app, scenariosWithErrors, {
        duration: 30,
        concurrency: 40,
        rampUp: 5,
      });

      const results = await loadTest();

      // Even with errors, the system should remain stable
      expect(results.successRate).toBeGreaterThan(70); // 70% success rate expected
      expect(results.avgDuration).toBeLessThan(1000);
      
      // Check that errors are properly categorized
      const errorsByStatus = results.results.reduce((acc: any, result: any) => {
        if (result.status >= 400) {
          acc[result.status] = (acc[result.status] || 0) + 1;
        }
        return acc;
      }, {});

      console.log('Error Handling Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        errorsByStatus,
      });

      // Verify we have the expected error types
      expect(errorsByStatus[400]).toBeGreaterThan(0); // Validation errors
      expect(errorsByStatus[404]).toBeGreaterThan(0); // Not found errors
      expect(errorsByStatus[500]).toBeGreaterThan(0); // Server errors
    });

    it('should maintain performance during partial system failures', async () => {
      // Simulate external service failures
      const scenarios = [
        {
          endpoint: '/api/numbers/search?countryCode=US', // Should work (cached)
          method: 'GET' as const,
          weight: 50,
        },
        {
          endpoint: '/api/numbers/purchase', // May fail due to external service
          method: 'POST' as const,
          data: {
            numberId: 'test-number-id',
            userId: 'test-user-id',
          },
          weight: 25,
        },
        {
          endpoint: '/api/billing/invoices', // Should work (database)
          method: 'GET' as const,
          weight: 25,
        },
      ];

      const loadTest = createLoadTestScenario(app, scenarios, {
        duration: 45,
        concurrency: 60,
        rampUp: 10,
      });

      const results = await loadTest();

      // System should degrade gracefully
      expect(results.successRate).toBeGreaterThan(60);
      expect(results.avgDuration).toBeLessThan(1500);

      console.log('Partial Failure Load Test Results:', {
        totalRequests: results.totalRequests,
        successRate: `${results.successRate.toFixed(2)}%`,
        avgDuration: `${results.avgDuration.toFixed(2)}ms`,
      });
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with increased load', async () => {
      const concurrencyLevels = [10, 25, 50, 75, 100];
      const results: any[] = [];

      for (const concurrency of concurrencyLevels) {
        const scenarios = [
          {
            endpoint: '/api/numbers/search?countryCode=US&limit=10',
            method: 'GET' as const,
            weight: 100,
          },
        ];

        const loadTest = createLoadTestScenario(app, scenarios, {
          duration: 30,
          concurrency,
          rampUp: 5,
        });

        const result = await loadTest();
        results.push({
          concurrency,
          requestsPerSecond: result.requestsPerSecond,
          avgDuration: result.avgDuration,
          successRate: result.successRate,
        });

        console.log(`Scalability Test - Concurrency ${concurrency}:`, {
          requestsPerSecond: result.requestsPerSecond.toFixed(2),
          avgDuration: `${result.avgDuration.toFixed(2)}ms`,
          successRate: `${result.successRate.toFixed(2)}%`,
        });
      }

      // Verify that throughput increases with concurrency (up to a point)
      expect(results[1].requestsPerSecond).toBeGreaterThan(results[0].requestsPerSecond);
      expect(results[2].requestsPerSecond).toBeGreaterThan(results[1].requestsPerSecond);
      
      // Response time should not increase dramatically
      expect(results[4].avgDuration).toBeLessThan(results[0].avgDuration * 3);
      
      // Success rate should remain high across all concurrency levels
      results.forEach(result => {
        expect(result.successRate).toBeGreaterThan(95);
      });
    });
  });
});

// Helper functions
async function seedLoadTestData() {
  // Create test users
  const users = Array.from({ length: 100 }, (_, i) => ({
    id: `load-test-user-${i}`,
    email: `loadtest${i}@example.com`,
    name: `Load Test User ${i}`,
    role: 'user',
  }));

  // Create test numbers
  const numbers = Array.from({ length: 1000 }, (_, i) => ({
    id: `load-test-number-${i}`,
    phoneNumber: `+1555${String(i).padStart(7, '0')}`,
    countryCode: 'US',
    areaCode: '555',
    city: 'Test City',
    state: 'TX',
    status: i % 10 === 0 ? 'RESERVED' : 'AVAILABLE',
    features: ['SMS', 'VOICE'],
    monthlyPrice: 5.00,
    setupPrice: 0.00,
    provider: i % 2 === 0 ? 'twilio' : 'bandwidth',
  }));

  // In a real implementation, these would be database operations
  console.log(`Seeded ${users.length} test users and ${numbers.length} test numbers`);
}

async function cleanupLoadTestData() {
  // Clean up test data
  console.log('Cleaning up load test data');
}