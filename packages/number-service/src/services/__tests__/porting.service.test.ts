import { PortingService } from '../porting.service';
import { PortingRequestRepository } from '../../repositories/porting-request.repository';
import { VirtualNumberRepository } from '../../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../../repositories/number-configuration.repository';

// Mock the repositories
jest.mock('../../repositories/porting-request.repository');
jest.mock('../../repositories/virtual-number.repository');
jest.mock('../../repositories/number-configuration.repository');

const MockPortingRequestRepository = PortingRequestRepository as jest.MockedClass<typeof PortingRequestRepository>;
const MockVirtualNumberRepository = VirtualNumberRepository as jest.MockedClass<typeof VirtualNumberRepository>;
const MockNumberConfigurationRepository = NumberConfigurationRepository as jest.MockedClass<typeof NumberConfigurationRepository>;

describe('PortingService', () => {
  let service: PortingService;
  let mockPortingRepo: jest.Mocked<PortingRequestRepository>;
  let mockNumberRepo: jest.Mocked<VirtualNumberRepository>;
  let mockConfigRepo: jest.Mocked<NumberConfigurationRepository>;

  beforeEach(() => {
    // Create mock instances
    mockPortingRepo = new MockPortingRequestRepository() as jest.Mocked<PortingRequestRepository>;
    mockNumberRepo = new MockVirtualNumberRepository() as jest.Mocked<VirtualNumberRepository>;
    mockConfigRepo = new MockNumberConfigurationRepository() as jest.Mocked<NumberConfigurationRepository>;

    // Create service instance
    service = new PortingService(mockPortingRepo, mockNumberRepo, mockConfigRepo);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validatePortingRequest', () => {
    const validPortingData = {
      userId: 'user123',
      currentNumber: '+1234567890',
      currentCarrier: 'Verizon',
      accountNumber: '123456789',
      pin: '1234',
      authorizedName: 'John Doe',
      billingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
    };

    it('should validate valid porting request', async () => {
      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      const result = await service.validatePortingRequest(validPortingData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid phone number', async () => {
      const invalidData = {
        ...validPortingData,
        currentNumber: 'invalid-number',
      };

      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      const result = await service.validatePortingRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });

    it('should return errors for missing required fields', async () => {
      const invalidData = {
        ...validPortingData,
        currentCarrier: '',
        accountNumber: '',
        pin: '',
        authorizedName: '',
      };

      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      const result = await service.validatePortingRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current carrier is required');
      expect(result.errors).toContain('Account number is required');
      expect(result.errors).toContain('PIN/Password is required');
      expect(result.errors).toContain('Authorized name is required');
    });

    it('should return errors for incomplete billing address', async () => {
      const invalidData = {
        ...validPortingData,
        billingAddress: {
          street: '123 Main St',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
      };

      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      const result = await service.validatePortingRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Complete billing address is required');
    });

    it('should return errors if number already exists in system', async () => {
      mockNumberRepo.findByPhoneNumber.mockResolvedValue({
        id: 'existing123',
        phoneNumber: '+1234567890',
      } as any);

      const result = await service.validatePortingRequest(validPortingData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This number is already in the VoxLink system');
    });
  });

  describe('initiatePorting', () => {
    const validPortingData = {
      userId: 'user123',
      currentNumber: '+1234567890',
      currentCarrier: 'Verizon',
      accountNumber: '123456789',
      pin: '1234',
      authorizedName: 'John Doe',
      billingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
    };

    it('should initiate porting request successfully', async () => {
      const mockPortingRequest = {
        id: 'porting123',
        ...validPortingData,
        status: 'SUBMITTED',
        estimatedCompletion: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);
      mockPortingRepo.findByCurrentNumber.mockResolvedValue(null);
      mockPortingRepo.create.mockResolvedValue(mockPortingRequest as any);
      mockPortingRepo.addStatusUpdate.mockResolvedValue({} as any);

      const result = await service.initiatePorting(validPortingData);

      expect(result).toEqual(mockPortingRequest);
      expect(mockPortingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validPortingData,
          estimatedCompletion: expect.any(Date),
        })
      );
      expect(mockPortingRepo.addStatusUpdate).toHaveBeenCalledWith({
        portingRequestId: mockPortingRequest.id,
        status: 'SUBMITTED',
        message: 'Porting request submitted and under review',
        updatedBy: 'system',
      });
    });

    it('should throw error if validation fails', async () => {
      const invalidData = {
        ...validPortingData,
        currentNumber: 'invalid-number',
      };

      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      await expect(service.initiatePorting(invalidData)).rejects.toThrow(
        'Porting validation failed'
      );
    });

    it('should throw error if active porting request exists', async () => {
      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);
      mockPortingRepo.findByCurrentNumber.mockResolvedValue({
        id: 'existing123',
        status: 'PROCESSING',
      } as any);

      await expect(service.initiatePorting(validPortingData)).rejects.toThrow(
        'Active porting request already exists'
      );
    });
  });

  describe('updatePortingStatus', () => {
    it('should update porting status successfully', async () => {
      const mockUpdatedRequest = {
        id: 'porting123',
        status: 'PROCESSING',
        updatedAt: new Date(),
      };

      mockPortingRepo.updateStatus.mockResolvedValue(mockUpdatedRequest as any);

      const result = await service.updatePortingStatus(
        'porting123',
        'PROCESSING',
        'Porting approved and processing',
        'admin'
      );

      expect(result).toEqual(mockUpdatedRequest);
      expect(mockPortingRepo.updateStatus).toHaveBeenCalledWith(
        'porting123',
        'PROCESSING',
        'Porting approved and processing',
        'admin'
      );
    });
  });

  describe('getPortingProgress', () => {
    it('should return porting progress', async () => {
      const mockPortingRequest = {
        id: 'porting123',
        status: 'PROCESSING',
        estimatedCompletion: new Date(),
        updatedAt: new Date(),
      };

      mockPortingRepo.findByIdWithDetails.mockResolvedValue(mockPortingRequest as any);

      const result = await service.getPortingProgress('porting123');

      expect(result).toHaveProperty('currentStep');
      expect(result).toHaveProperty('completedSteps');
      expect(result).toHaveProperty('remainingSteps');
      expect(result).toHaveProperty('estimatedCompletion');
      expect(result).toHaveProperty('lastUpdate');
    });

    it('should throw error if porting request not found', async () => {
      mockPortingRepo.findByIdWithDetails.mockResolvedValue(null);

      await expect(service.getPortingProgress('nonexistent')).rejects.toThrow(
        'Porting request not found'
      );
    });
  });

  describe('getUserPortingRequests', () => {
    it('should return user porting requests', async () => {
      const mockRequests = [
        {
          id: 'porting123',
          userId: 'user123',
          status: 'SUBMITTED',
        },
      ];

      mockPortingRepo.findByUserId.mockResolvedValue(mockRequests as any);
      mockPortingRepo.countByUserId.mockResolvedValue(1);

      const result = await service.getUserPortingRequests('user123');

      expect(result.requests).toEqual(mockRequests);
      expect(result.total).toBe(1);
    });
  });

  describe('cancelPortingRequest', () => {
    it('should cancel porting request successfully', async () => {
      const mockPortingRequest = {
        id: 'porting123',
        status: 'SUBMITTED',
      };

      const mockCancelledRequest = {
        id: 'porting123',
        status: 'CANCELLED',
      };

      mockPortingRepo.findById.mockResolvedValue(mockPortingRequest as any);
      mockPortingRepo.updateStatus.mockResolvedValue(mockCancelledRequest as any);

      const result = await service.cancelPortingRequest(
        'porting123',
        'User requested cancellation',
        'user123'
      );

      expect(result).toEqual(mockCancelledRequest);
      expect(mockPortingRepo.updateStatus).toHaveBeenCalledWith(
        'porting123',
        'CANCELLED',
        'Cancelled: User requested cancellation',
        'user123'
      );
    });

    it('should throw error if porting request not found', async () => {
      mockPortingRepo.findById.mockResolvedValue(null);

      await expect(
        service.cancelPortingRequest('nonexistent', 'reason', 'user')
      ).rejects.toThrow('Porting request not found');
    });

    it('should throw error if porting request cannot be cancelled', async () => {
      const mockPortingRequest = {
        id: 'porting123',
        status: 'COMPLETED',
      };

      mockPortingRepo.findById.mockResolvedValue(mockPortingRequest as any);

      await expect(
        service.cancelPortingRequest('porting123', 'reason', 'user')
      ).rejects.toThrow('Cannot cancel porting request in status: COMPLETED');
    });
  });
});