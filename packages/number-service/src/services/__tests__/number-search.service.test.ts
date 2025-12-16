import { NumberSearchService } from '../number-search.service';
import { TelecomProviderService } from '../telecom-provider.service';
import { RedisService } from '../redis.service';
import { SearchCriteria } from '@voxlink/shared';

// Mock dependencies
jest.mock('../telecom-provider.service');
jest.mock('../redis.service');

describe('NumberSearchService', () => {
  let searchService: NumberSearchService;
  let mockTelecomProvider: jest.Mocked<TelecomProviderService>;
  let mockRedisService: jest.Mocked<typeof RedisService>;

  beforeEach(() => {
    searchService = new NumberSearchService();
    mockTelecomProvider = new TelecomProviderService() as jest.Mocked<TelecomProviderService>;
    mockRedisService = RedisService as jest.Mocked<typeof RedisService>;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('searchNumbers', () => {
    const validCriteria: SearchCriteria = {
      countryCode: 'US',
      areaCode: '212',
      limit: 10,
    };

    const mockProviderResponse = {
      numbers: [
        {
          phoneNumber: '+12125551234',
          countryCode: 'US',
          areaCode: '212',
          city: 'New York',
          region: 'NY',
          monthlyRate: 1000,
          setupFee: 500,
          features: ['call_forwarding', 'voicemail'],
          provider: 'mock-provider',
        },
        {
          phoneNumber: '+12125555678',
          countryCode: 'US',
          areaCode: '212',
          city: 'New York',
          region: 'NY',
          monthlyRate: 1200,
          setupFee: 600,
          features: ['call_forwarding', 'voicemail', 'sms'],
          provider: 'mock-provider',
        },
      ],
      totalCount: 2,
      searchId: 'test-search-123',
      provider: 'mock-provider',
    };

    it('should return search results from telecom provider', async () => {
      // Mock no cached results
      mockRedisService.get.mockResolvedValue(null);
      
      // Mock telecom provider response
      mockTelecomProvider.searchAvailableNumbers.mockResolvedValue(mockProviderResponse);
      
      // Mock cache set
      mockRedisService.set.mockResolvedValue(true);

      const result = await searchService.searchNumbers(validCriteria);

      expect(result.numbers).toHaveLength(2);
      expect(result.searchId).toBe('test-search-123');
      expect(result.totalCount).toBe(2);
      expect(mockTelecomProvider.searchAvailableNumbers).toHaveBeenCalledWith(validCriteria);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const cachedResult = {
        numbers: mockProviderResponse.numbers,
        totalCount: 2,
        searchId: 'cached-search-456',
        timestamp: new Date(),
      };

      mockRedisService.get.mockResolvedValue(cachedResult);

      const result = await searchService.searchNumbers(validCriteria);

      expect(result).toEqual(cachedResult);
      expect(mockTelecomProvider.searchAvailableNumbers).not.toHaveBeenCalled();
    });

    it('should validate search criteria', async () => {
      const invalidCriteria = {
        countryCode: '', // Invalid - empty country code
        limit: 10,
      } as SearchCriteria;

      await expect(searchService.searchNumbers(invalidCriteria))
        .rejects.toThrow('Invalid search criteria');
    });

    it('should apply feature filters', async () => {
      const criteriaWithFeatures: SearchCriteria = {
        ...validCriteria,
        features: ['sms'],
      };

      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.searchAvailableNumbers.mockResolvedValue(mockProviderResponse);
      mockRedisService.set.mockResolvedValue(true);

      const result = await searchService.searchNumbers(criteriaWithFeatures);

      // Should only return numbers with SMS feature
      expect(result.numbers).toHaveLength(1);
      expect(result.numbers[0].phoneNumber).toBe('+12125555678');
    });

    it('should apply cost filters', async () => {
      const criteriaWithCostLimit: SearchCriteria = {
        ...validCriteria,
        maxMonthlyRate: 1100,
      };

      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.searchAvailableNumbers.mockResolvedValue(mockProviderResponse);
      mockRedisService.set.mockResolvedValue(true);

      const result = await searchService.searchNumbers(criteriaWithCostLimit);

      // Should only return numbers under the cost limit
      expect(result.numbers).toHaveLength(1);
      expect(result.numbers[0].monthlyRate).toBeLessThanOrEqual(1100);
    });

    it('should handle telecom provider errors', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.searchAvailableNumbers.mockRejectedValue(new Error('Provider error'));

      await expect(searchService.searchNumbers(validCriteria))
        .rejects.toThrow('Failed to search for available numbers');
    });
  });

  describe('getNumberDetails', () => {
    const phoneNumber = '+12125551234';

    it('should return cached number details', async () => {
      const cachedDetails = {
        phoneNumber,
        countryCode: 'US',
        areaCode: '212',
        city: 'New York',
        region: 'NY',
        monthlyRate: 1000,
        setupFee: 500,
        features: ['call_forwarding'],
        provider: 'mock-provider',
      };

      mockRedisService.get.mockResolvedValue(cachedDetails);

      const result = await searchService.getNumberDetails(phoneNumber);

      expect(result).toEqual(cachedDetails);
      expect(mockTelecomProvider.checkNumberAvailability).not.toHaveBeenCalled();
    });

    it('should check availability and generate details for uncached numbers', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.checkNumberAvailability.mockResolvedValue(true);
      mockTelecomProvider.searchAvailableNumbers.mockResolvedValue({
        numbers: [{
          phoneNumber: '+12125559999',
          countryCode: 'US',
          areaCode: '212',
          city: 'New York',
          region: 'NY',
          monthlyRate: 1000,
          setupFee: 500,
          features: ['call_forwarding'],
          provider: 'mock-provider',
        }],
        totalCount: 1,
        searchId: 'test',
        provider: 'mock',
      });
      mockRedisService.set.mockResolvedValue(true);

      const result = await searchService.getNumberDetails(phoneNumber);

      expect(result).toBeTruthy();
      expect(result?.phoneNumber).toBe(phoneNumber);
      expect(mockTelecomProvider.checkNumberAvailability).toHaveBeenCalledWith(phoneNumber);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return null for unavailable numbers', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockTelecomProvider.checkNumberAvailability.mockResolvedValue(false);

      const result = await searchService.getNumberDetails(phoneNumber);

      expect(result).toBeNull();
    });
  });

  describe('checkBulkAvailability', () => {
    it('should check availability for multiple numbers', async () => {
      const phoneNumbers = ['+12125551234', '+12125555678', '+12125559999'];
      
      mockTelecomProvider.checkNumberAvailability
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await searchService.checkBulkAvailability(phoneNumbers);

      expect(result).toEqual({
        '+12125551234': true,
        '+12125555678': false,
        '+12125559999': true,
      });
      expect(mockTelecomProvider.checkNumberAvailability).toHaveBeenCalledTimes(3);
    });

    it('should handle large batches with concurrency control', async () => {
      const phoneNumbers = Array.from({ length: 25 }, (_, i) => `+1212555${i.toString().padStart(4, '0')}`);
      
      mockTelecomProvider.checkNumberAvailability.mockResolvedValue(true);

      const result = await searchService.checkBulkAvailability(phoneNumbers);

      expect(Object.keys(result)).toHaveLength(25);
      expect(mockTelecomProvider.checkNumberAvailability).toHaveBeenCalledTimes(25);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return suggestions for US', async () => {
      const suggestions = await searchService.getSearchSuggestions({ countryCode: 'US' });

      expect(suggestions.areaCodes).toContain('212');
      expect(suggestions.cities).toContain('New York');
      expect(suggestions.regions).toContain('NY');
    });

    it('should return suggestions for Canada', async () => {
      const suggestions = await searchService.getSearchSuggestions({ countryCode: 'CA' });

      expect(suggestions.areaCodes).toContain('416');
      expect(suggestions.cities).toContain('Toronto');
      expect(suggestions.regions).toContain('ON');
    });

    it('should return empty arrays for unknown countries', async () => {
      const suggestions = await searchService.getSearchSuggestions({ countryCode: 'XX' });

      expect(suggestions.areaCodes).toEqual([]);
      expect(suggestions.cities).toEqual([]);
      expect(suggestions.regions).toEqual([]);
    });
  });
});