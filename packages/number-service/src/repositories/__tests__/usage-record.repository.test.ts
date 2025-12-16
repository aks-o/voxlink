import { UsageRecordRepository, CreateUsageRecordData } from '../usage-record.repository';
import { DatabaseService } from '../../services/database.service';
import { UsageEventType } from '@prisma/client';

// Mock the database service
jest.mock('../../services/database.service');

describe('UsageRecordRepository', () => {
  let repository: UsageRecordRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      usageRecord: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    (DatabaseService.getClient as jest.Mock).mockReturnValue(mockDb);
    repository = new UsageRecordRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a usage record', async () => {
      const createData: CreateUsageRecordData = {
        numberId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'INBOUND_CALL' as UsageEventType,
        duration: 120,
        cost: 100,
        fromNumber: '+1987654321',
        toNumber: '+1234567890',
        metadata: { callId: 'call123' },
      };

      const mockUsageRecord = {
        id: 'usage1',
        ...createData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockDb.usageRecord.create.mockResolvedValue(mockUsageRecord);

      const result = await repository.create(createData);

      expect(result).toEqual(mockUsageRecord);
      expect(mockDb.usageRecord.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          timestamp: expect.any(Date),
          metadata: createData.metadata,
        },
      });
    });

    it('should create usage record with default metadata', async () => {
      const createData: CreateUsageRecordData = {
        numberId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'SMS_SENT' as UsageEventType,
        cost: 50,
      };

      const mockUsageRecord = {
        id: 'usage1',
        ...createData,
        timestamp: new Date(),
        createdAt: new Date(),
        metadata: {},
      };

      mockDb.usageRecord.create.mockResolvedValue(mockUsageRecord);

      await repository.create(createData);

      expect(mockDb.usageRecord.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          timestamp: expect.any(Date),
          metadata: {},
        },
      });
    });
  });

  describe('findById', () => {
    it('should find usage record by id', async () => {
      const mockUsageRecord = {
        id: 'usage1',
        numberId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'INBOUND_CALL',
        duration: 120,
        cost: 100,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockDb.usageRecord.findUnique.mockResolvedValue(mockUsageRecord);

      const result = await repository.findById('usage1');

      expect(result).toEqual(mockUsageRecord);
      expect(mockDb.usageRecord.findUnique).toHaveBeenCalledWith({
        where: { id: 'usage1' },
      });
    });

    it('should return null when usage record not found', async () => {
      mockDb.usageRecord.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByNumberId', () => {
    it('should find usage records by number id', async () => {
      const mockUsageRecords = [
        {
          id: 'usage1',
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'INBOUND_CALL',
          duration: 120,
          cost: 100,
          timestamp: new Date(),
        },
        {
          id: 'usage2',
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'SMS_RECEIVED',
          cost: 25,
          timestamp: new Date(),
        },
      ];

      mockDb.usageRecord.findMany.mockResolvedValue(mockUsageRecords);

      const result = await repository.findByNumberId('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockUsageRecords);
      expect(mockDb.usageRecord.findMany).toHaveBeenCalledWith({
        where: { numberId: '123e4567-e89b-12d3-a456-426614174000' },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should apply filters when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const filters = {
        eventType: 'INBOUND_CALL' as UsageEventType,
        startDate,
        endDate,
        fromNumber: '+1987654321',
      };

      mockDb.usageRecord.findMany.mockResolvedValue([]);

      await repository.findByNumberId('123e4567-e89b-12d3-a456-426614174000', 25, 10, filters);

      expect(mockDb.usageRecord.findMany).toHaveBeenCalledWith({
        where: {
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'INBOUND_CALL',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          fromNumber: '+1987654321',
        },
        orderBy: { timestamp: 'desc' },
        take: 25,
        skip: 10,
      });
    });
  });

  describe('getUsageStatistics', () => {
    it('should calculate usage statistics', async () => {
      const mockGroupByResults = [
        {
          eventType: 'INBOUND_CALL',
          _count: { id: 5 },
          _sum: { duration: 600, cost: 500 },
        },
        {
          eventType: 'OUTBOUND_CALL',
          _count: { id: 3 },
          _sum: { duration: 300, cost: 300 },
        },
        {
          eventType: 'SMS_RECEIVED',
          _count: { id: 10 },
          _sum: { duration: 0, cost: 250 },
        },
        {
          eventType: 'SMS_SENT',
          _count: { id: 8 },
          _sum: { duration: 0, cost: 200 },
        },
        {
          eventType: 'VOICEMAIL_RECEIVED',
          _count: { id: 2 },
          _sum: { duration: 0, cost: 100 },
        },
        {
          eventType: 'CALL_FORWARDED',
          _count: { id: 1 },
          _sum: { duration: 60, cost: 50 },
        },
      ];

      mockDb.usageRecord.groupBy.mockResolvedValue(mockGroupByResults);

      const result = await repository.getUsageStatistics('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        totalCalls: 8, // inbound + outbound
        totalSms: 18, // received + sent
        totalDuration: 960, // sum of all durations
        totalCost: 1400, // sum of all costs
        inboundCalls: 5,
        outboundCalls: 3,
        smsReceived: 10,
        smsSent: 8,
        voicemailsReceived: 2,
        callsForwarded: 1,
        averageCallDuration: 120, // 960 / 8
        peakUsageHour: 0, // placeholder
        costBreakdown: {
          calls: 800, // inbound + outbound call costs
          sms: 450, // received + sent SMS costs
          voicemail: 100,
          forwarding: 50,
        },
      });
    });

    it('should handle empty statistics', async () => {
      mockDb.usageRecord.groupBy.mockResolvedValue([]);

      const result = await repository.getUsageStatistics('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        totalCalls: 0,
        totalSms: 0,
        totalDuration: 0,
        totalCost: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        smsReceived: 0,
        smsSent: 0,
        voicemailsReceived: 0,
        callsForwarded: 0,
        averageCallDuration: 0,
        peakUsageHour: 0,
        costBreakdown: {
          calls: 0,
          sms: 0,
          voicemail: 0,
          forwarding: 0,
        },
      });
    });

    it('should apply date filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockDb.usageRecord.groupBy.mockResolvedValue([]);

      await repository.getUsageStatistics('123e4567-e89b-12d3-a456-426614174000', startDate, endDate);

      expect(mockDb.usageRecord.groupBy).toHaveBeenCalledWith({
        by: ['eventType'],
        where: {
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: { id: true },
        _sum: { duration: true, cost: true },
      });
    });
  });

  describe('getUsageByDateRange', () => {
    it('should group usage by date', async () => {
      const mockRecords = [
        {
          id: 'usage1',
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'INBOUND_CALL',
          duration: 120,
          cost: 100,
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'usage2',
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'SMS_RECEIVED',
          duration: 0,
          cost: 25,
          timestamp: new Date('2024-01-01T14:00:00Z'),
        },
        {
          id: 'usage3',
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'INBOUND_CALL',
          duration: 90,
          cost: 75,
          timestamp: new Date('2024-01-02T09:00:00Z'),
        },
      ];

      mockDb.usageRecord.findMany.mockResolvedValue(mockRecords);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const result = await repository.getUsageByDateRange(
        '123e4567-e89b-12d3-a456-426614174000',
        startDate,
        endDate
      );

      expect(result).toEqual([
        {
          date: '2024-01-01',
          count: 2,
          cost: 125,
          duration: 120,
        },
        {
          date: '2024-01-02',
          count: 1,
          cost: 75,
          duration: 90,
        },
      ]);
    });
  });

  describe('countByNumberId', () => {
    it('should count usage records by number id', async () => {
      mockDb.usageRecord.count.mockResolvedValue(42);

      const result = await repository.countByNumberId('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBe(42);
      expect(mockDb.usageRecord.count).toHaveBeenCalledWith({
        where: { numberId: '123e4567-e89b-12d3-a456-426614174000' },
      });
    });

    it('should apply filters when counting', async () => {
      const filters = {
        eventType: 'INBOUND_CALL' as UsageEventType,
        startDate: new Date('2024-01-01'),
      };

      mockDb.usageRecord.count.mockResolvedValue(10);

      await repository.countByNumberId('123e4567-e89b-12d3-a456-426614174000', filters);

      expect(mockDb.usageRecord.count).toHaveBeenCalledWith({
        where: {
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'INBOUND_CALL',
          timestamp: {
            gte: new Date('2024-01-01'),
          },
        },
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should get recent activity for a number', async () => {
      const mockRecords = [
        {
          id: 'usage1',
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'INBOUND_CALL',
          timestamp: new Date('2024-01-02T10:00:00Z'),
        },
        {
          id: 'usage2',
          numberId: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'SMS_RECEIVED',
          timestamp: new Date('2024-01-01T14:00:00Z'),
        },
      ];

      mockDb.usageRecord.findMany.mockResolvedValue(mockRecords);

      const result = await repository.getRecentActivity('123e4567-e89b-12d3-a456-426614174000', 5);

      expect(result).toEqual(mockRecords);
      expect(mockDb.usageRecord.findMany).toHaveBeenCalledWith({
        where: { numberId: '123e4567-e89b-12d3-a456-426614174000' },
        orderBy: { timestamp: 'desc' },
        take: 5,
      });
    });
  });

  describe('deleteByNumberId', () => {
    it('should delete all usage records for a number', async () => {
      mockDb.usageRecord.deleteMany.mockResolvedValue({ count: 5 });

      await repository.deleteByNumberId('123e4567-e89b-12d3-a456-426614174000');

      expect(mockDb.usageRecord.deleteMany).toHaveBeenCalledWith({
        where: { numberId: '123e4567-e89b-12d3-a456-426614174000' },
      });
    });
  });
});