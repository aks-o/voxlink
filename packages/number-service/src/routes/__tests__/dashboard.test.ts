import request from 'supertest';
import express from 'express';
import { dashboardRouter } from '../dashboard';
import { VirtualNumberRepository } from '../../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../../repositories/number-configuration.repository';
import { UsageRecordRepository } from '../../repositories/usage-record.repository';
import { errorHandler } from '../../middleware/error-handler';

// Mock the repositories
jest.mock('../../repositories/virtual-number.repository');
jest.mock('../../repositories/number-configuration.repository');
jest.mock('../../repositories/usage-record.repository');

const MockVirtualNumberRepository = VirtualNumberRepository as jest.MockedClass<typeof VirtualNumberRepository>;
const MockNumberConfigurationRepository = NumberConfigurationRepository as jest.MockedClass<typeof NumberConfigurationRepository>;
const MockUsageRecordRepository = UsageRecordRepository as jest.MockedClass<typeof UsageRecordRepository>;

describe('Dashboard Routes', () => {
  let app: express.Application;
  let mockVirtualNumberRepo: jest.Mocked<VirtualNumberRepository>;
  let mockConfigRepo: jest.Mocked<NumberConfigurationRepository>;
  let mockUsageRepo: jest.Mocked<UsageRecordRepository>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/dashboard', dashboardRouter);
    app.use(errorHandler);

    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockVirtualNumberRepo = new MockVirtualNumberRepository() as jest.Mocked<VirtualNumberRepository>;
    mockConfigRepo = new MockNumberConfigurationRepository() as jest.Mocked<NumberConfigurationRepository>;
    mockUsageRepo = new MockUsageRecordRepository() as jest.Mocked<UsageRecordRepository>;

    // Mock the constructor calls
    MockVirtualNumberRepository.mockImplementation(() => mockVirtualNumberRepo);
    MockNumberConfigurationRepository.mockImplementation(() => mockConfigRepo);
    MockUsageRecordRepository.mockImplementation(() => mockUsageRepo);
  });

  describe('GET /numbers', () => {
    const mockNumbers = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+1234567890',
        countryCode: 'US',
        areaCode: '123',
        city: 'New York',
        region: 'NY',
        status: 'ACTIVE' as any,
        ownerId: 'user123',
        purchaseDate: new Date('2024-01-01'),
        activationDate: new Date('2024-01-01'),
        monthlyRate: 1000,
        setupFee: 500,
        features: ['SMS', 'VOICE'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        configuration: null,
      },
    ];

    const mockUsageStats = {
      totalCalls: 10,
      totalSms: 5,
      totalDuration: 300,
      totalCost: 1500,
      inboundCalls: 6,
      outboundCalls: 4,
      smsReceived: 3,
      smsSent: 2,
      voicemailsReceived: 1,
      callsForwarded: 0,
      averageCallDuration: 30,
      peakUsageHour: 14,
      costBreakdown: {
        calls: 1200,
        sms: 200,
        voicemail: 100,
        forwarding: 0,
      },
    };

    it('should return user numbers with enhanced data', async () => {
      mockVirtualNumberRepo.search.mockResolvedValue(mockNumbers);
      mockVirtualNumberRepo.countByOwner.mockResolvedValue(1);
      mockUsageRepo.getRecentActivity.mockResolvedValue([]);
      mockUsageRepo.getUsageStatistics.mockResolvedValue(mockUsageStats);

      const response = await request(app)
        .get('/api/v1/dashboard/numbers')
        .query({ ownerId: 'user123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('recentActivity');
      expect(response.body.data[0]).toHaveProperty('monthlyStats');
      expect(response.body.pagination).toEqual({
        total: 1,
        limit: 50,
        offset: 0,
      });
    });

    it('should return 400 when ownerId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/numbers');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('ownerId query parameter is required');
    });

    it('should support search functionality', async () => {
      mockVirtualNumberRepo.search.mockResolvedValue([]);
      mockVirtualNumberRepo.countByOwner.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/dashboard/numbers')
        .query({ 
          ownerId: 'user123',
          search: 'New York'
        });

      expect(response.status).toBe(200);
      expect(mockVirtualNumberRepo.search).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user123',
          OR: expect.arrayContaining([
            { phoneNumber: { contains: 'New York' } },
            { city: { contains: 'New York', mode: 'insensitive' } },
            { region: { contains: 'New York', mode: 'insensitive' } },
          ]),
        }),
        50,
        0
      );
    });
  });

  describe('GET /numbers/:id/details', () => {
    const mockNumber = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      phoneNumber: '+1234567890',
      countryCode: 'US',
      areaCode: '123',
      city: 'New York',
      region: 'NY',
      status: 'ACTIVE' as any,
      ownerId: 'user123',
      purchaseDate: new Date('2024-01-01'),
      activationDate: new Date('2024-01-01'),
      monthlyRate: 1000,
      setupFee: 500,
      features: ['SMS', 'VOICE'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      configuration: null,
    };

    const mockUsageStats = {
      totalCalls: 10,
      totalSms: 5,
      totalDuration: 300,
      totalCost: 1500,
      inboundCalls: 6,
      outboundCalls: 4,
      smsReceived: 3,
      smsSent: 2,
      voicemailsReceived: 1,
      callsForwarded: 0,
      averageCallDuration: 30,
      peakUsageHour: 14,
      costBreakdown: {
        calls: 1200,
        sms: 200,
        voicemail: 100,
        forwarding: 0,
      },
    };

    it('should return detailed number information', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue(mockNumber);
      mockUsageRepo.getUsageStatistics.mockResolvedValue(mockUsageStats);
      mockUsageRepo.getRecentActivity.mockResolvedValue([]);
      mockUsageRepo.getUsageByDateRange.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/details');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('number');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('recentActivity');
      expect(response.body.data).toHaveProperty('usageHistory');
      expect(response.body.data.statistics.period).toBe('30 days');
    });

    it('should return 404 when number not found', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/dashboard/numbers/nonexistent/details');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Virtual number not found');
    });

    it('should support custom period parameter', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue(mockNumber);
      mockUsageRepo.getUsageStatistics.mockResolvedValue(mockUsageStats);
      mockUsageRepo.getRecentActivity.mockResolvedValue([]);
      mockUsageRepo.getUsageByDateRange.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/details')
        .query({ period: '7' });

      expect(response.status).toBe(200);
      expect(response.body.data.statistics.period).toBe('7 days');
    });
  });

  describe('GET /numbers/:id/usage', () => {
    const mockUsageRecords = [
      {
        id: 'usage1',
        numberId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'INBOUND_CALL' as any,
        duration: 120,
        cost: 100,
        timestamp: new Date('2024-01-01T10:00:00Z'),
        fromNumber: '+1987654321',
        toNumber: '+1234567890',
        metadata: {},
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
    ];

    it('should return usage records for a number', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue({} as any);
      mockUsageRepo.findByNumberId.mockResolvedValue(mockUsageRecords);
      mockUsageRepo.countByNumberId.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/usage');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should support date filtering', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue({} as any);
      mockUsageRepo.findByNumberId.mockResolvedValue([]);
      mockUsageRepo.countByNumberId.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/usage')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          eventType: 'INBOUND_CALL'
        });

      expect(response.status).toBe(200);
      expect(mockUsageRepo.findByNumberId).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        100,
        0,
        expect.objectContaining({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          eventType: 'INBOUND_CALL',
        })
      );
    });
  });

  describe('PUT /numbers/:id/settings', () => {
    const mockConfiguration = {
      id: 'config1',
      numberId: '123e4567-e89b-12d3-a456-426614174000',
      callForwardingEnabled: true,
      primaryDestination: '+1987654321',
      voicemailEnabled: true,
      timezone: 'America/New_York',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update number settings', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue({} as any);
      mockConfigRepo.findByNumberId.mockResolvedValue(mockConfiguration as any);
      mockConfigRepo.update.mockResolvedValue(mockConfiguration as any);

      const updateData = {
        callForwardingEnabled: false,
        primaryDestination: '+1555555555',
      };

      const response = await request(app)
        .put('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/settings')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateData
      );
    });

    it('should create default configuration if none exists', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue({} as any);
      mockConfigRepo.findByNumberId.mockResolvedValue(null);
      mockConfigRepo.createDefaultConfiguration.mockResolvedValue(mockConfiguration as any);
      mockConfigRepo.update.mockResolvedValue(mockConfiguration as any);

      const response = await request(app)
        .put('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/settings')
        .send({ callForwardingEnabled: true });

      expect(response.status).toBe(200);
      expect(mockConfigRepo.createDefaultConfiguration).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });

    it('should filter out invalid fields', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue({} as any);
      mockConfigRepo.findByNumberId.mockResolvedValue(mockConfiguration as any);
      mockConfigRepo.update.mockResolvedValue(mockConfiguration as any);

      const updateData = {
        callForwardingEnabled: true,
        invalidField: 'should be filtered',
        anotherInvalidField: 123,
      };

      const response = await request(app)
        .put('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/settings')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        { callForwardingEnabled: true }
      );
    });

    it('should return 400 when no valid fields provided', async () => {
      mockVirtualNumberRepo.findById.mockResolvedValue({} as any);

      const response = await request(app)
        .put('/api/v1/dashboard/numbers/123e4567-e89b-12d3-a456-426614174000/settings')
        .send({ invalidField: 'value' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('No valid fields provided');
    });
  });

  describe('GET /overview', () => {
    const mockNumbers = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+1234567890',
        status: 'ACTIVE' as any,
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        phoneNumber: '+1234567891',
        status: 'ACTIVE' as any,
      },
    ];

    const mockUsageStats = {
      totalCalls: 10,
      totalSms: 5,
      totalDuration: 300,
      totalCost: 1500,
      inboundCalls: 6,
      outboundCalls: 4,
      smsReceived: 3,
      smsSent: 2,
      voicemailsReceived: 1,
      callsForwarded: 0,
      averageCallDuration: 30,
      peakUsageHour: 14,
      costBreakdown: {
        calls: 1200,
        sms: 200,
        voicemail: 100,
        forwarding: 0,
      },
    };

    it('should return dashboard overview', async () => {
      mockVirtualNumberRepo.findByOwner.mockResolvedValue(mockNumbers as any);
      mockUsageRepo.getUsageStatistics.mockResolvedValue(mockUsageStats);

      const response = await request(app)
        .get('/api/v1/dashboard/overview')
        .query({ ownerId: 'user123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('topPerformers');
      expect(response.body.data.overview.totalNumbers).toBe(2);
      expect(response.body.data.overview.activeNumbers).toBe(2);
    });

    it('should return 400 when ownerId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/overview');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('ownerId query parameter is required');
    });
  });

  describe('PUT /numbers/bulk-update', () => {
    const mockConfiguration = {
      id: 'config1',
      numberId: '123e4567-e89b-12d3-a456-426614174000',
      callForwardingEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should bulk update number settings', async () => {
      const numberIds = ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'];
      
      mockVirtualNumberRepo.findById.mockResolvedValue({} as any);
      mockConfigRepo.findByNumberId.mockResolvedValue(mockConfiguration as any);
      mockConfigRepo.update.mockResolvedValue(mockConfiguration as any);

      const response = await request(app)
        .put('/api/v1/dashboard/numbers/bulk-update')
        .send({
          numberIds,
          updates: { callForwardingEnabled: false }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary.total).toBe(2);
      expect(response.body.summary.successful).toBe(2);
      expect(response.body.summary.failed).toBe(0);
    });

    it('should return 400 when numberIds is empty', async () => {
      const response = await request(app)
        .put('/api/v1/dashboard/numbers/bulk-update')
        .send({
          numberIds: [],
          updates: { callForwardingEnabled: false }
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('numberIds array is required');
    });

    it('should return 400 when too many numbers provided', async () => {
      const numberIds = Array.from({ length: 51 }, (_, i) => `number-${i}`);
      
      const response = await request(app)
        .put('/api/v1/dashboard/numbers/bulk-update')
        .send({
          numberIds,
          updates: { callForwardingEnabled: false }
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Maximum 50 numbers allowed');
    });
  });
});