import request from 'supertest';
import express from 'express';
import { numbersRouter } from '../numbers';
import { NumberSearchService } from '../../services/number-search.service';
import { errorHandler } from '../../middleware/error-handler';

// Mock the search service
jest.mock('../../services/number-search.service');
jest.mock('../../repositories/virtual-number.repository');
jest.mock('../../repositories/number-configuration.repository');

describe('Numbers Search API', () => {
  let app: express.Application;
  let mockSearchService: jest.Mocked<NumberSearchService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/numbers', numbersRouter);
    app.use(errorHandler);

    mockSearchService = new NumberSearchService() as jest.Mocked<NumberSearchService>;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/numbers/search/available', () => {
    const mockSearchResult = {
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
      ],
      totalCount: 1,
      searchId: 'test-search-123',
      timestamp: new Date(),
    };

    it('should search for available numbers with basic criteria', async () => {
      mockSearchService.searchNumbers.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .get('/api/numbers/search/available')
        .query({
          countryCode: 'US',
          areaCode: '212',
          limit: '10',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.numbers).toHaveLength(1);
      expect(response.body.data.searchId).toBe('test-search-123');
    });

    it('should search with advanced filters', async () => {
      mockSearchService.searchNumbers.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .get('/api/numbers/search/available')
        .query({
          countryCode: 'US',
          areaCode: '212',
          city: 'New York',
          features: 'call_forwarding,voicemail',
          maxMonthlyRate: '1500',
          maxSetupFee: '1000',
          pattern: '555',
          sortBy: 'cost',
          limit: '5',
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.searchNumbers).toHaveBeenCalledWith(
        expect.objectContaining({
          countryCode: 'US',
          areaCode: '212',
          city: 'New York',
          features: ['call_forwarding', 'voicemail'],
          maxMonthlyRate: 1500,
          maxSetupFee: 1000,
          pattern: '555',
          limit: 5,
          preferences: expect.objectContaining({
            sortBy: 'cost',
          }),
        })
      );
    });

    it('should return 400 for missing countryCode', async () => {
      const response = await request(app)
        .get('/api/numbers/search/available')
        .query({
          areaCode: '212',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('countryCode is required');
    });

    it('should handle search service errors', async () => {
      mockSearchService.searchNumbers.mockRejectedValue(new Error('Search failed'));

      const response = await request(app)
        .get('/api/numbers/search/available')
        .query({
          countryCode: 'US',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/numbers/search/advanced', () => {
    const mockSearchResult = {
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
      ],
      totalCount: 1,
      searchId: 'test-search-456',
      timestamp: new Date(),
    };

    it('should perform advanced search with complex criteria', async () => {
      mockSearchService.searchNumbers.mockResolvedValue(mockSearchResult);

      const searchCriteria = {
        countryCode: 'US',
        areaCode: '212',
        city: 'New York',
        features: ['call_forwarding', 'voicemail'],
        maxMonthlyRate: 1500,
        preferences: {
          sortBy: 'cost',
          preferredFeatures: ['sms'],
          preferredAreaCodes: ['212', '646'],
        },
        limit: 20,
      };

      const response = await request(app)
        .post('/api/numbers/search/advanced')
        .send(searchCriteria);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.numbers).toHaveLength(1);
      expect(mockSearchService.searchNumbers).toHaveBeenCalledWith(searchCriteria);
    });

    it('should return 400 for missing countryCode in POST body', async () => {
      const response = await request(app)
        .post('/api/numbers/search/advanced')
        .send({
          areaCode: '212',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('countryCode is required');
    });
  });

  describe('GET /api/numbers/details/:phoneNumber', () => {
    const phoneNumber = '+12125551234';
    const mockNumberDetails = {
      phoneNumber,
      countryCode: 'US',
      areaCode: '212',
      city: 'New York',
      region: 'NY',
      monthlyRate: 1000,
      setupFee: 500,
      features: ['call_forwarding', 'voicemail'],
      provider: 'mock-provider',
    };

    it('should return number details when available', async () => {
      mockSearchService.getNumberDetails.mockResolvedValue(mockNumberDetails);

      const response = await request(app)
        .get(`/api/numbers/details/${encodeURIComponent(phoneNumber)}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phoneNumber).toBe(phoneNumber);
      expect(mockSearchService.getNumberDetails).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return 404 when number is not available', async () => {
      mockSearchService.getNumberDetails.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/numbers/details/${encodeURIComponent(phoneNumber)}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Number not available');
    });
  });

  describe('POST /api/numbers/availability/bulk', () => {
    it('should check bulk availability', async () => {
      const phoneNumbers = ['+12125551234', '+12125555678', '+12125559999'];
      const mockAvailability = {
        '+12125551234': true,
        '+12125555678': false,
        '+12125559999': true,
      };

      mockSearchService.checkBulkAvailability.mockResolvedValue(mockAvailability);

      const response = await request(app)
        .post('/api/numbers/availability/bulk')
        .send({ phoneNumbers });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAvailability);
      expect(response.body.summary).toEqual({
        total: 3,
        available: 2,
        unavailable: 1,
      });
    });

    it('should return 400 for empty phoneNumbers array', async () => {
      const response = await request(app)
        .post('/api/numbers/availability/bulk')
        .send({ phoneNumbers: [] });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('phoneNumbers array is required');
    });

    it('should return 400 for too many phone numbers', async () => {
      const phoneNumbers = Array.from({ length: 101 }, (_, i) => `+1212555${i.toString().padStart(4, '0')}`);

      const response = await request(app)
        .post('/api/numbers/availability/bulk')
        .send({ phoneNumbers });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Maximum 100 phone numbers allowed');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/api/numbers/availability/bulk')
        .send({ invalidField: 'test' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/numbers/search/suggestions', () => {
    const mockSuggestions = {
      areaCodes: ['212', '646', '917'],
      cities: ['New York', 'Brooklyn', 'Queens'],
      regions: ['NY'],
    };

    it('should return search suggestions', async () => {
      mockSearchService.getSearchSuggestions.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .get('/api/numbers/search/suggestions')
        .query({ countryCode: 'US' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSuggestions);
      expect(mockSearchService.getSearchSuggestions).toHaveBeenCalledWith({
        countryCode: 'US',
        areaCode: undefined,
        city: undefined,
      });
    });

    it('should return suggestions with partial criteria', async () => {
      mockSearchService.getSearchSuggestions.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .get('/api/numbers/search/suggestions')
        .query({
          countryCode: 'US',
          areaCode: '212',
          city: 'New York',
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.getSearchSuggestions).toHaveBeenCalledWith({
        countryCode: 'US',
        areaCode: '212',
        city: 'New York',
      });
    });
  });
});