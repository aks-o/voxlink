import { TelecomProviderManager } from '../telecom-provider-manager.service';
import { TwilioProvider } from '../providers/twilio-provider.service';
import { BandwidthProvider } from '../providers/bandwidth-provider.service';
import { 
  NumberSearchRequest, 
  NumberReservationRequest,
  NumberPurchaseRequest,
  PortingRequest 
} from '@voxlink/shared/types/telecom-provider';

// Mock axios
jest.mock('axios');

// Mock cache service
jest.mock('@voxlink/shared/services/cache.service', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    connect: jest.fn(),
  })),
}));

describe('Telecom Provider Integration', () => {
  let providerManager: TelecomProviderManager;

  beforeEach(() => {
    jest.clearAllMocks();
    providerManager = new TelecomProviderManager();
  });

  describe('Provider Failover', () => {
    it('should failover to secondary provider when primary fails', async () => {
      const searchRequest: NumberSearchRequest = {
        countryCode: 'US',
        areaCode: '212',
        limit: 10,
      };

      // Mock primary provider failure
      const mockTwilioProvider = {
        searchNumbers: jest.fn().mockRejectedValue(new Error('Twilio API error')),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'twilio', priority: 1 }),
      };

      // Mock secondary provider success
      const mockBandwidthProvider = {
        searchNumbers: jest.fn().mockResolvedValue({
          numbers: [
            {
              phoneNumber: '+12125551234',
              countryCode: 'US',
              areaCode: '212',
              city: 'New York',
              region: 'NY',
              monthlyRate: 100,
              setupFee: 50,
              features: ['voice', 'sms'],
              provider: 'bandwidth',
              providerId: '12125551234',
            },
          ],
          totalCount: 1,
          searchId: 'bandwidth_search_123',
          provider: 'bandwidth',
          responseTime: 150,
          cached: false,
        }),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'bandwidth', priority: 2 }),
      };

      // Replace providers in manager
      (providerManager as any).providers.set('twilio', mockTwilioProvider);
      (providerManager as any).providers.set('bandwidth', mockBandwidthProvider);

      const result = await providerManager.searchNumbers(searchRequest);

      expect(mockTwilioProvider.searchNumbers).toHaveBeenCalledWith(searchRequest);
      expect(mockBandwidthProvider.searchNumbers).toHaveBeenCalledWith(searchRequest);
      expect(result.provider).toBe('bandwidth');
      expect(result.numbers).toHaveLength(1);
    });

    it('should throw error when all providers fail', async () => {
      const searchRequest: NumberSearchRequest = {
        countryCode: 'US',
        areaCode: '212',
        limit: 10,
      };

      // Mock all providers failing
      const mockFailingProvider = {
        searchNumbers: jest.fn().mockRejectedValue(new Error('Provider API error')),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'test', priority: 1 }),
      };

      (providerManager as any).providers.set('twilio', mockFailingProvider);
      (providerManager as any).providers.set('bandwidth', mockFailingProvider);

      await expect(providerManager.searchNumbers(searchRequest)).rejects.toThrow(
        'All providers failed for number search'
      );
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after multiple failures', async () => {
      const searchRequest: NumberSearchRequest = {
        countryCode: 'US',
        limit: 10,
      };

      const mockProvider = {
        searchNumbers: jest.fn().mockRejectedValue(new Error('Provider error')),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'twilio', priority: 1 }),
      };

      (providerManager as any).providers.set('twilio', mockProvider);

      // Trigger multiple failures to open circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await providerManager.searchNumbers(searchRequest);
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit breaker should now be open
      const circuitBreaker = (providerManager as any).circuitBreakers.get('twilio');
      expect(circuitBreaker.isOpen).toBe(true);
      expect(circuitBreaker.failureCount).toBe(3);
    });

    it('should reset circuit breaker after timeout', async () => {
      const mockProvider = {
        searchNumbers: jest.fn().mockResolvedValue({
          numbers: [],
          totalCount: 0,
          searchId: 'test',
          provider: 'twilio',
          responseTime: 100,
          cached: false,
        }),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'twilio', priority: 1 }),
      };

      (providerManager as any).providers.set('twilio', mockProvider);

      // Manually set circuit breaker to open with old timestamp
      const circuitBreaker = (providerManager as any).circuitBreakers.get('twilio');
      circuitBreaker.isOpen = true;
      circuitBreaker.lastFailure = new Date(Date.now() - 400000); // 6+ minutes ago
      circuitBreaker.failureCount = 5;

      const searchRequest: NumberSearchRequest = {
        countryCode: 'US',
        limit: 10,
      };

      const result = await providerManager.searchNumbers(searchRequest);

      expect(result.provider).toBe('twilio');
      expect(circuitBreaker.isOpen).toBe(false);
      expect(circuitBreaker.failureCount).toBe(0);
    });
  });

  describe('Provider Health Checks', () => {
    it('should exclude unhealthy providers from selection', async () => {
      const searchRequest: NumberSearchRequest = {
        countryCode: 'US',
        limit: 10,
      };

      const mockUnhealthyProvider = {
        searchNumbers: jest.fn(),
        isHealthy: jest.fn().mockReturnValue(false),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'twilio', priority: 1 }),
      };

      const mockHealthyProvider = {
        searchNumbers: jest.fn().mockResolvedValue({
          numbers: [],
          totalCount: 0,
          searchId: 'bandwidth_search',
          provider: 'bandwidth',
          responseTime: 100,
          cached: false,
        }),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'bandwidth', priority: 2 }),
      };

      (providerManager as any).providers.set('twilio', mockUnhealthyProvider);
      (providerManager as any).providers.set('bandwidth', mockHealthyProvider);

      const result = await providerManager.searchNumbers(searchRequest);

      expect(mockUnhealthyProvider.searchNumbers).not.toHaveBeenCalled();
      expect(mockHealthyProvider.searchNumbers).toHaveBeenCalled();
      expect(result.provider).toBe('bandwidth');
    });
  });

  describe('Provider Capabilities', () => {
    it('should select provider based on feature support', async () => {
      const portingRequest: PortingRequest = {
        phoneNumber: '+12125551234',
        currentProvider: 'Verizon',
        accountNumber: '123456789',
        pin: '1234',
        authorizedName: 'John Doe',
        serviceAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };

      const mockTwilioProvider = {
        portNumber: jest.fn(),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockImplementation((feature) => feature !== 'number_porting'),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'twilio', priority: 1 }),
      };

      const mockBandwidthProvider = {
        portNumber: jest.fn().mockResolvedValue({
          portingId: 'bandwidth_port_123',
          phoneNumber: '+12125551234',
          status: 'submitted',
          estimatedCompletion: new Date(),
        }),
        isHealthy: jest.fn().mockReturnValue(true),
        supportsFeature: jest.fn().mockReturnValue(true),
        supportsRegion: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'bandwidth', priority: 2 }),
      };

      (providerManager as any).providers.set('twilio', mockTwilioProvider);
      (providerManager as any).providers.set('bandwidth', mockBandwidthProvider);

      const result = await providerManager.portNumber(portingRequest);

      expect(mockTwilioProvider.portNumber).not.toHaveBeenCalled();
      expect(mockBandwidthProvider.portNumber).toHaveBeenCalled();
      expect(result.portingId).toBe('bandwidth_port_123');
    });
  });

  describe('Caching', () => {
    it('should return cached results when available', async () => {
      const searchRequest: NumberSearchRequest = {
        countryCode: 'US',
        areaCode: '212',
        limit: 10,
      };

      const cachedResult = {
        numbers: [
          {
            phoneNumber: '+12125551234',
            countryCode: 'US',
            areaCode: '212',
            city: 'New York',
            region: 'NY',
            monthlyRate: 100,
            setupFee: 50,
            features: ['voice', 'sms'],
            provider: 'twilio',
            providerId: '12125551234',
          },
        ],
        totalCount: 1,
        searchId: 'cached_search_123',
        provider: 'twilio',
        responseTime: 50,
        cached: false,
      };

      // Mock cache service to return cached result
      const mockCacheService = (providerManager as any).cacheService;
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await providerManager.searchNumbers(searchRequest);

      expect(result.cached).toBe(true);
      expect(result.searchId).toBe('cached_search_123');
      expect(mockCacheService.get).toHaveBeenCalled();
    });
  });

  describe('Provider Metrics', () => {
    it('should track provider metrics correctly', () => {
      const metrics = providerManager.getProviderMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });

    it('should track provider health correctly', () => {
      const health = providerManager.getProviderHealth();
      
      expect(health).toBeDefined();
      expect(typeof health).toBe('object');
    });
  });

  describe('Number Reservation', () => {
    it('should reserve number with specific provider', async () => {
      const reservationRequest: NumberReservationRequest = {
        phoneNumber: '+12125551234',
        providerId: 'twilio',
        reservationDuration: 10,
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const mockProvider = {
        reserveNumber: jest.fn().mockResolvedValue({
          reservationId: 'twilio_res_123',
          phoneNumber: '+12125551234',
          provider: 'twilio',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          status: 'reserved',
        }),
        isHealthy: jest.fn().mockReturnValue(true),
        getProvider: jest.fn().mockReturnValue({ id: 'twilio' }),
      };

      (providerManager as any).providers.set('twilio', mockProvider);

      const result = await providerManager.reserveNumber(reservationRequest);

      expect(mockProvider.reserveNumber).toHaveBeenCalledWith(reservationRequest);
      expect(result.reservationId).toBe('twilio_res_123');
      expect(result.status).toBe('reserved');
    });
  });

  describe('Number Purchase', () => {
    it('should purchase number with specific provider', async () => {
      const purchaseRequest: NumberPurchaseRequest = {
        phoneNumber: '+12125551234',
        providerId: 'twilio',
        reservationId: 'twilio_res_123',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        },
      };

      const mockProvider = {
        purchaseNumber: jest.fn().mockResolvedValue({
          purchaseId: 'twilio_purchase_123',
          phoneNumber: '+12125551234',
          provider: 'twilio',
          status: 'purchased',
          activationDate: new Date(),
          monthlyRate: 100,
          setupFee: 0,
          features: ['voice', 'sms'],
        }),
        getProvider: jest.fn().mockReturnValue({ id: 'twilio' }),
      };

      (providerManager as any).providers.set('twilio', mockProvider);

      const result = await providerManager.purchaseNumber(purchaseRequest);

      expect(mockProvider.purchaseNumber).toHaveBeenCalledWith(purchaseRequest);
      expect(result.purchaseId).toBe('twilio_purchase_123');
      expect(result.status).toBe('purchased');
    });
  });
});