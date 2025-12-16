import request from 'supertest';
import express from 'express';
import { billingRouter } from '../billing';
import { DatabaseService } from '../../services/database.service';
import { errorHandler } from '../../middleware/error-handler';

// Mock the database service
jest.mock('../../services/database.service');

describe('Billing Routes', () => {
  let app: express.Application;
  let mockPrisma: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/billing', billingRouter);
    app.use(errorHandler);

    // Mock Prisma client
    mockPrisma = {
      usageEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      paymentMethod: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      billingAccount: {
        findUnique: jest.fn(),
      },
      billingCycle: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    (DatabaseService.getClient as jest.Mock).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /usage', () => {
    it('should track usage event successfully', async () => {
      const mockUsageEvent = {
        id: 'usage1',
        billingAccountId: 'account1',
        numberId: 'number1',
        eventType: 'INBOUND_CALL',
        duration: 120,
        quantity: 2,
        unitCost: 2,
        totalCost: 4,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockPrisma.usageEvent.create.mockResolvedValue(mockUsageEvent);

      const response = await request(app)
        .post('/api/v1/billing/usage')
        .send({
          billingAccountId: 'account1',
          numberId: 'number1',
          eventType: 'INBOUND_CALL',
          duration: 120,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUsageEvent);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/billing/usage')
        .send({
          billingAccountId: 'account1',
          // Missing numberId and eventType
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('billingAccountId, numberId, and eventType are required');
    });
  });

  describe('GET /usage/statistics', () => {
    it('should return usage statistics', async () => {
      const mockStats = {
        totalEvents: 10,
        totalCost: 1000,
        eventBreakdown: {
          INBOUND_CALL: { count: 5, cost: 500, duration: 600 },
          SMS_RECEIVED: { count: 5, cost: 500 },
        },
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      mockPrisma.usageEvent.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/billing/usage/statistics')
        .query({
          billingAccountId: 'account1',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when required query parameters are missing', async () => {
      const response = await request(app)
        .get('/api/v1/billing/usage/statistics')
        .query({
          billingAccountId: 'account1',
          // Missing startDate and endDate
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('billingAccountId, startDate, and endDate are required');
    });
  });

  describe('POST /invoices', () => {
    it('should generate invoice successfully', async () => {
      const mockBillingAccount = {
        id: 'account1',
        userId: 'user1',
        billingPeriod: 'MONTHLY',
      };

      const mockInvoice = {
        id: 'invoice1',
        billingAccountId: 'account1',
        invoiceNumber: 'INV-202401-0001',
        status: 'SENT',
        subtotal: 1000,
        tax: 80,
        total: 1080,
        items: [],
        billingAccount: mockBillingAccount,
      };

      mockPrisma.billingAccount.findUnique.mockResolvedValue(mockBillingAccount);
      mockPrisma.invoice.create.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.usageEvent.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/billing/invoices')
        .send({
          billingAccountId: 'account1',
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/billing/invoices')
        .send({
          billingAccountId: 'account1',
          // Missing periodStart and periodEnd
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('billingAccountId, periodStart, and periodEnd are required');
    });
  });

  describe('GET /invoices/:id', () => {
    it('should return invoice by ID', async () => {
      const mockInvoice = {
        id: 'invoice1',
        invoiceNumber: 'INV-202401-0001',
        status: 'SENT',
        items: [],
        billingAccount: { id: 'account1' },
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const response = await request(app)
        .get('/api/v1/billing/invoices/invoice1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInvoice);
    });

    it('should return 404 when invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/billing/invoices/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Invoice not found');
    });
  });

  describe('GET /pricing', () => {
    it('should return pricing information', async () => {
      const response = await request(app)
        .get('/api/v1/billing/pricing');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('setupFee');
      expect(response.body.data).toHaveProperty('monthlyBase');
      expect(response.body.data).toHaveProperty('inboundCallPerMinute');
      expect(response.body.data).toHaveProperty('taxRate');
      expect(response.body.data).toHaveProperty('currency');
    });
  });

  describe('POST /pricing/calculate', () => {
    it('should calculate cost for usage event', async () => {
      const response = await request(app)
        .post('/api/v1/billing/pricing/calculate')
        .send({
          eventType: 'INBOUND_CALL',
          duration: 120,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('unitCost');
      expect(response.body.data).toHaveProperty('totalCost');
      expect(response.body.data).toHaveProperty('quantity');
      expect(response.body.data).toHaveProperty('description');
    });

    it('should return 400 when eventType is missing', async () => {
      const response = await request(app)
        .post('/api/v1/billing/pricing/calculate')
        .send({
          duration: 120,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('eventType is required');
    });
  });
});