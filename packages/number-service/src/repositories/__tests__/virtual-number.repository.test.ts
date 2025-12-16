import { VirtualNumberRepository, CreateVirtualNumberData } from '../virtual-number.repository';
import { DatabaseService } from '../../services/database.service';

// Mock the database service
jest.mock('../../services/database.service');

describe('VirtualNumberRepository', () => {
  let repository: VirtualNumberRepository;
  let mockDb: any;

  beforeEach(() => {
    repository = new VirtualNumberRepository();
    mockDb = {
      virtualNumber: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      numberReservation: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    (DatabaseService.getClient as jest.Mock).mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a virtual number with default status', async () => {
      const createData: CreateVirtualNumberData = {
        phoneNumber: '+1234567890',
        countryCode: 'US',
        areaCode: '123',
        city: 'New York',
        region: 'NY',
        monthlyRate: 1000,
        setupFee: 500,
        features: ['call_forwarding'],
      };

      const expectedResult = {
        id: 'test-id',
        ...createData,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.virtualNumber.create.mockResolvedValue(expectedResult);

      const result = await repository.create(createData);

      expect(mockDb.virtualNumber.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          status: 'AVAILABLE',
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle database errors', async () => {
      const createData: CreateVirtualNumberData = {
        phoneNumber: '+1234567890',
        countryCode: 'US',
        areaCode: '123',
        city: 'New York',
        region: 'NY',
        monthlyRate: 1000,
        setupFee: 500,
        features: [],
      };

      mockDb.virtualNumber.create.mockRejectedValue(new Error('Database error'));

      await expect(repository.create(createData)).rejects.toThrow('Database operation failed');
    });
  });

  describe('findById', () => {
    it('should find a virtual number by ID with configuration', async () => {
      const expectedResult = {
        id: 'test-id',
        phoneNumber: '+1234567890',
        configuration: {
          id: 'config-id',
          numberId: 'test-id',
        },
      };

      mockDb.virtualNumber.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findById('test-id');

      expect(mockDb.virtualNumber.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: { configuration: true },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should return null if number not found', async () => {
      mockDb.virtualNumber.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByPhoneNumber', () => {
    it('should find a virtual number by phone number', async () => {
      const expectedResult = {
        id: 'test-id',
        phoneNumber: '+1234567890',
        configuration: null,
      };

      mockDb.virtualNumber.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findByPhoneNumber('+1234567890');

      expect(mockDb.virtualNumber.findUnique).toHaveBeenCalledWith({
        where: { phoneNumber: '+1234567890' },
        include: { configuration: true },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByOwner', () => {
    it('should find virtual numbers by owner with pagination', async () => {
      const expectedResults = [
        { id: 'test-id-1', ownerId: 'user-1' },
        { id: 'test-id-2', ownerId: 'user-1' },
      ];

      mockDb.virtualNumber.findMany.mockResolvedValue(expectedResults);

      const result = await repository.findByOwner('user-1', 10, 0);

      expect(mockDb.virtualNumber.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        include: { configuration: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
      expect(result).toEqual(expectedResults);
    });
  });

  describe('reserveNumber', () => {
    it('should reserve a number using transaction', async () => {
      const phoneNumber = '+1234567890';
      const userId = 'user-1';
      const expiresAt = new Date();

      mockDb.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          virtualNumber: {
            update: jest.fn(),
          },
          numberReservation: {
            create: jest.fn(),
          },
        };
        return await callback(mockTx);
      });

      await repository.reserveNumber(phoneNumber, userId, expiresAt);

      expect(mockDb.$transaction).toHaveBeenCalled();
    });
  });

  describe('findAvailableNumbers', () => {
    it('should find available numbers by country and area code', async () => {
      const expectedResults = [
        { id: 'test-id-1', status: 'AVAILABLE', countryCode: 'US', areaCode: '123' },
        { id: 'test-id-2', status: 'AVAILABLE', countryCode: 'US', areaCode: '123' },
      ];

      mockDb.virtualNumber.findMany.mockResolvedValue(expectedResults);

      const result = await repository.findAvailableNumbers('US', '123', 10);

      expect(mockDb.virtualNumber.findMany).toHaveBeenCalledWith({
        where: {
          status: 'AVAILABLE',
          countryCode: 'US',
          areaCode: '123',
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
      expect(result).toEqual(expectedResults);
    });

    it('should find available numbers by country only', async () => {
      const expectedResults = [
        { id: 'test-id-1', status: 'AVAILABLE', countryCode: 'US' },
      ];

      mockDb.virtualNumber.findMany.mockResolvedValue(expectedResults);

      const result = await repository.findAvailableNumbers('US', undefined, 5);

      expect(mockDb.virtualNumber.findMany).toHaveBeenCalledWith({
        where: {
          status: 'AVAILABLE',
          countryCode: 'US',
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
      });
      expect(result).toEqual(expectedResults);
    });
  });
});