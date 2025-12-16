import { NumberSearchService } from '../number-search.service';
import { TelecomProviderService } from '../telecom-provider.service';
import { RedisService } from '../redis.service';
import { SearchCriteria } from '@voxlink/shared';

// Mock dependencies
jest.mock('../telecom-provider.service');
jest.mock('../redis.service');

describe('Search Performance Tests', () => {
  let searchService: NumberSearchService;
  let mockTelecomProvider: jest.Mocked<TelecomProviderService>;
  let mockRedisService: jest.Mocked<typeof RedisService>;

  beforeEach(() => {
    searchService = new NumberSearchService();
    mockTelecomProvider = new TelecomProviderService() as jest.Mocked<TelecomProviderService>;
    mockRedisService = RedisService as jest.Mocked<typeof RedisService>;
    
    jest.clearAllMocks();
  });

  describe('Search Response Time', () => {
    it('should complete search within 3 seconds', async () => {
      const criteria: SearchCriteria = {
        countryCode: 'US',
        areaCode: '212',
        limit: 50,
      };

      // Mock provider response with large dataset
      const mockNumbers = Array.from({ length: 50 }, (_, i) => ({
        phoneNumber: `+1212555${i.toString().padStart(4, '0')}`,
        countryCode: 'US',
        areaCode: '212',
        city: 'New York',
        region: 'NY',
        monthlyRate: 1000 + (i * 10),
        setupFee: 500,
        features: ['call_forwarding', 'voicemail'],
        provider: 'mock-provider',
      }));

      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.searchAvailableNumbers.mockResolvedValue({
        numbers: mockNumbers,
        totalCount: 50,
        searchId: 'perf-test',
        provider: 'mock',
      });
      mockRedisService.set.mockResolvedValue(true);

      const startTime = Date.now();
      const result = await searchService.searchNumbers(criteria);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(result.numbers).toHaveLength(50);
    });

    it('should benefit from caching on repeated searches', async () => {
      const criteria: SearchCriteria = {
        countryCode: 'US',
        areaCode: '212',
        limit: 10,
      };

      const cachedResult = {
        numbers: [{
          phoneNumber: '+12125551234',
          countryCode: 'US',
          areaCode: '212',
          city: 'New York',
          region: 'NY',
          monthlyRate: 1000,
          setupFee: 500,
          features: ['call_forwarding'],
          provider: 'mock',
        }],
        totalCount: 1,
        searchId: 'cached-search',
        timestamp: new Date(),
      };

      mockRedisService.get.mockResolvedValue(cachedResult);

      const startTime = Date.now();
      const result = await searchService.searchNumbers(criteria);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(100); // Cached response should be very fast
      expect(result).toEqual(cachedResult);
      expect(mockTelecomProvider.searchAvailableNumbers).not.toHaveBeenCalled();
    });
  });

  describe('Bulk Availability Performance', () => {
    it('should handle 100 numbers within reasonable time', async () => {
      const phoneNumbers = Array.from({ length: 100 }, (_, i) => 
        `+1212555${i.toString().padStart(4, '0')}`
      );

      // Mock availability checks (simulate some delay)
      mockTelecomProvider.checkNumberAvailability.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay per check
        return Math.random() > 0.5; // Random availability
      });

      const startTime = Date.now();
      const result = await searchService.checkBulkAvailability(phoneNumbers);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(Object.keys(result)).toHaveLength(100);
      expect(mockTelecomProvider.checkNumberAvailability).toHaveBeenCalledTimes(100);
    });

    it('should process requests in parallel with concurrency control', async () => {
      const phoneNumbers = Array.from({ length: 50 }, (_, i) => 
        `+1212555${i.toString().padStart(4, '0')}`
      );

      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      mockTelecomProvider.checkNumberAvailability.mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
        
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
        
        concurrentCalls--;
        return true;
      });

      await searchService.checkBulkAvailability(phoneNumbers);

      // Should not exceed concurrency limit (10 based on implementation)
      expect(maxConcurrentCalls).toBeLessThanOrEqual(10);
      expect(mockTelecomProvider.checkNumberAvailability).toHaveBeenCalledTimes(50);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with large result sets', async () => {
      const criteria: SearchCriteria = {
        countryCode: 'US',
        limit: 1000, // Large result set
      };

      // Generate large mock dataset
      const mockNumbers = Array.from({ length: 1000 }, (_, i) => ({
        phoneNumber: `+1212555${i.toString().padStart(4, '0')}`,
        countryCode: 'US',
        areaCode: '212',
        city: 'New York',
        region: 'NY',
        monthlyRate: 1000,
        setupFee: 500,
        features: ['call_forwarding'],
        provider: 'mock',
      }));

      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.searchAvailableNumbers.mockResolvedValue({
        numbers: mockNumbers,
        totalCount: 1000,
        searchId: 'memory-test',
        provider: 'mock',
      });
      mockRedisService.set.mockResolvedValue(true);

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple searches
      for (let i = 0; i < 5; i++) {
        await searchService.searchNumbers({
          ...criteria,
          areaCode: `21${i}`, // Different area codes to avoid caching
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Error Handling Performance', () => {
    it('should fail fast on invalid criteria', async () => {
      const invalidCriteria = {
        countryCode: '', // Invalid
        limit: 10,
      } as SearchCriteria;

      const startTime = Date.now();
      
      try {
        await searchService.searchNumbers(invalidCriteria);
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(responseTime).toBeLessThan(100); // Should fail quickly
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle provider timeouts gracefully', async () => {
      const criteria: SearchCriteria = {
        countryCode: 'US',
        limit: 10,
      };

      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.searchAvailableNumbers.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 6000)); // 6 second delay
        throw new Error('Timeout');
      });

      const startTime = Date.now();
      
      try {
        await searchService.searchNumbers(criteria);
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(responseTime).toBeGreaterThan(5000); // Should wait for timeout
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});