import { NumberActivationService, ActivationRequest } from '../number-activation.service';
import { VirtualNumberRepository } from '../../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../../repositories/number-configuration.repository';
import { TelecomProviderService } from '../telecom-provider.service';
import { RedisService } from '../redis.service';
import { NumberStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../repositories/virtual-number.repository');
jest.mock('../../repositories/number-configuration.repository');
jest.mock('../telecom-provider.service');
jest.mock('../redis.service');

describe('NumberActivationService', () => {
  let activationService: NumberActivationService;
  let mockVirtualNumberRepo: jest.Mocked<VirtualNumberRepository>;
  let mockConfigRepo: jest.Mocked<NumberConfigurationRepository>;
  let mockTelecomProvider: jest.Mocked<TelecomProviderService>;
  let mockRedisService: jest.Mocked<typeof RedisService>;

  beforeEach(() => {
    activationService = new NumberActivationService();
    mockVirtualNumberRepo = new VirtualNumberRepository() as jest.Mocked<VirtualNumberRepository>;
    mockConfigRepo = new NumberConfigurationRepository() as jest.Mocked<NumberConfigurationRepository>;
    mockTelecomProvider = new TelecomProviderService() as jest.Mocked<TelecomProviderService>;
    mockRedisService = RedisService as jest.Mocked<typeof RedisService>;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('activateNumber', () => {
    const validRequest: ActivationRequest = {
      phoneNumber: '+12125551234',
      userId: 'user-123',
      initialConfiguration: {
        callForwarding: {
          enabled: true,
          primaryDestination: '+12125559999',
          timeout: 30,
        },
      },
    };

    const mockNumber = {
      id: 'number-123',
      phoneNumber: '+12125551234',
      status: NumberStatus.RESERVED,
      ownerId: 'user-123',
      countryCode: 'US',
      areaCode: '212',
      city: 'New York',
      region: 'NY',
      monthlyRate: 1000,
      setupFee: 500,
      features: ['call_forwarding'],
      createdAt: new Date(),
      updatedAt: new Date(),
      configuration: null,
    };

    it('should successfully activate a reserved number', async () => {
      // Mock repository responses
      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(mockNumber);
      mockVirtualNumberRepo.update.mockResolvedValue({
        ...mockNumber,
        status: NumberStatus.ACTIVE,
        activationDate: new Date(),
      });

      // Mock configuration creation
      const mockConfig = {
        id: 'config-123',
        numberId: 'number-123',
        callForwardingEnabled: true,
        primaryDestination: '+12125559999',
        forwardingTimeout: 30,
        voicemailEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockConfigRepo.create.mockResolvedValue(mockConfig);

      // Mock Redis operations
      mockRedisService.set.mockResolvedValue(true);

      const result = await activationService.activateNumber(validRequest);

      expect(result.success).toBe(true);
      expect(result.phoneNumber).toBe(validRequest.phoneNumber);
      expect(result.status).toBe(NumberStatus.ACTIVE);
      expect(result.configuration).toEqual(mockConfig);

      // Verify repository calls
      expect(mockVirtualNumberRepo.findByPhoneNumber).toHaveBeenCalledWith(validRequest.phoneNumber);
      expect(mockVirtualNumberRepo.update).toHaveBeenCalledWith(
        mockNumber.id,
        expect.objectContaining({
          status: NumberStatus.ACTIVE,
          activationDate: expect.any(Date),
        })
      );
      expect(mockConfigRepo.create).toHaveBeenCalled();
    });

    it('should fail if number is not found', async () => {
      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      const result = await activationService.activateNumber(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Phone number not found');
      expect(mockVirtualNumberRepo.update).not.toHaveBeenCalled();
    });

    it('should fail if number is not reserved', async () => {
      const activeNumber = { ...mockNumber, status: NumberStatus.ACTIVE };
      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(activeNumber);

      const result = await activationService.activateNumber(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Number is not reserved');
      expect(mockVirtualNumberRepo.update).not.toHaveBeenCalled();
    });

    it('should fail if number is reserved for different user', async () => {
      const otherUserNumber = { ...mockNumber, ownerId: 'other-user' };
      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(otherUserNumber);

      const result = await activationService.activateNumber(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Number is not reserved for this user');
      expect(mockVirtualNumberRepo.update).not.toHaveBeenCalled();
    });

    it('should create default configuration if none provided', async () => {
      const requestWithoutConfig = {
        phoneNumber: '+12125551234',
        userId: 'user-123',
      };

      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(mockNumber);
      mockVirtualNumberRepo.update.mockResolvedValue({
        ...mockNumber,
        status: NumberStatus.ACTIVE,
      });

      const defaultConfig = {
        id: 'config-123',
        numberId: 'number-123',
        callForwardingEnabled: false,
        voicemailEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockConfigRepo.create.mockResolvedValue(defaultConfig);
      mockRedisService.set.mockResolvedValue(true);

      const result = await activationService.activateNumber(requestWithoutConfig);

      expect(result.success).toBe(true);
      expect(mockConfigRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          numberId: mockNumber.id,
          callForwardingEnabled: false,
          voicemailEnabled: true,
        })
      );
    });
  });

  describe('deactivateNumber', () => {
    const mockActiveNumber = {
      id: 'number-123',
      phoneNumber: '+12125551234',
      status: NumberStatus.ACTIVE,
      ownerId: 'user-123',
      configuration: null,
    };

    it('should successfully deactivate an active number', async () => {
      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(mockActiveNumber);
      mockVirtualNumberRepo.update.mockResolvedValue({
        ...mockActiveNumber,
        status: NumberStatus.SUSPENDED,
      });
      mockRedisService.delete.mockResolvedValue(true);

      const result = await activationService.deactivateNumber('+12125551234', 'user-123');

      expect(result.success).toBe(true);
      expect(result.status).toBe(NumberStatus.SUSPENDED);
      expect(mockVirtualNumberRepo.update).toHaveBeenCalledWith(
        mockActiveNumber.id,
        expect.objectContaining({
          status: NumberStatus.SUSPENDED,
        })
      );
    });

    it('should fail if user is not authorized', async () => {
      const otherUserNumber = { ...mockActiveNumber, ownerId: 'other-user' };
      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(otherUserNumber);

      const result = await activationService.deactivateNumber('+12125551234', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized to deactivate this number');
      expect(mockVirtualNumberRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getActivationStatus', () => {
    it('should return cached status if available', async () => {
      const cachedStatus = {
        status: NumberStatus.ACTIVE,
        activatedAt: new Date(),
        configuration: { id: 'config-123' },
      };
      mockRedisService.get.mockResolvedValue(cachedStatus);

      const result = await activationService.getActivationStatus('+12125551234');

      expect(result).toEqual(cachedStatus);
      expect(mockVirtualNumberRepo.findByPhoneNumber).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      
      const mockNumber = {
        id: 'number-123',
        phoneNumber: '+12125551234',
        status: NumberStatus.ACTIVE,
        activationDate: new Date(),
        configuration: { id: 'config-123' },
      };
      mockVirtualNumberRepo.findByPhoneNumber.mockResolvedValue(mockNumber);
      mockRedisService.set.mockResolvedValue(true);

      const result = await activationService.getActivationStatus('+12125551234');

      expect(result.status).toBe(NumberStatus.ACTIVE);
      expect(result.activatedAt).toEqual(mockNumber.activationDate);
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  describe('bulkActivateNumbers', () => {
    it('should process multiple activation requests', async () => {
      const requests: ActivationRequest[] = [
        { phoneNumber: '+12125551234', userId: 'user-123' },
        { phoneNumber: '+12125555678', userId: 'user-123' },
      ];

      // Mock successful activations
      mockVirtualNumberRepo.findByPhoneNumber
        .mockResolvedValueOnce({
          id: 'number-1',
          phoneNumber: '+12125551234',
          status: NumberStatus.RESERVED,
          ownerId: 'user-123',
          configuration: null,
        })
        .mockResolvedValueOnce({
          id: 'number-2',
          phoneNumber: '+12125555678',
          status: NumberStatus.RESERVED,
          ownerId: 'user-123',
          configuration: null,
        });

      mockVirtualNumberRepo.update
        .mockResolvedValueOnce({ id: 'number-1', status: NumberStatus.ACTIVE })
        .mockResolvedValueOnce({ id: 'number-2', status: NumberStatus.ACTIVE });

      mockConfigRepo.create
        .mockResolvedValueOnce({ id: 'config-1', numberId: 'number-1' })
        .mockResolvedValueOnce({ id: 'config-2', numberId: 'number-2' });

      mockRedisService.set.mockResolvedValue(true);

      const results = await activationService.bulkActivateNumbers(requests);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockVirtualNumberRepo.findByPhoneNumber).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure results', async () => {
      const requests: ActivationRequest[] = [
        { phoneNumber: '+12125551234', userId: 'user-123' },
        { phoneNumber: '+12125555678', userId: 'user-123' },
      ];

      // First succeeds, second fails
      mockVirtualNumberRepo.findByPhoneNumber
        .mockResolvedValueOnce({
          id: 'number-1',
          phoneNumber: '+12125551234',
          status: NumberStatus.RESERVED,
          ownerId: 'user-123',
          configuration: null,
        })
        .mockResolvedValueOnce(null); // Not found

      mockVirtualNumberRepo.update.mockResolvedValueOnce({
        id: 'number-1',
        status: NumberStatus.ACTIVE,
      });

      mockConfigRepo.create.mockResolvedValueOnce({
        id: 'config-1',
        numberId: 'number-1',
      });

      mockRedisService.set.mockResolvedValue(true);

      const results = await activationService.bulkActivateNumbers(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Phone number not found');
    });
  });
});