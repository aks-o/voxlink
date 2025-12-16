import request from 'supertest';
import express from 'express';
import { portingRouter } from '../porting';
import { PortingRequestRepository } from '../../repositories/porting-request.repository';
import { VirtualNumberRepository } from '../../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../../repositories/number-configuration.repository';
import { errorHandler } from '../../middleware/error-handler';

// Mock the repositories
jest.mock('../../repositories/porting-request.repository');
jest.mock('../../repositories/virtual-number.repository');
jest.mock('../../repositories/number-configuration.repository');

const MockPortingRequestRepository = PortingRequestRepository as jest.MockedClass<typeof PortingRequestRepository>;
const MockVirtualNumberRepository = VirtualNumberRepository as jest.MockedClass<typeof VirtualNumberRepository>;
const MockNumberConfigurationRepository = NumberConfigurationRepository as jest.MockedClass<typeof NumberConfigurationRepository>;

describe('Porting Routes', () => {
  let app: express.Application;
  let mockPortingRepo: jest.Mocked<PortingRequestRepository>;
  let mockNumberRepo: jest.Mocked<VirtualNumberRepository>;
  let mockConfigRepo: jest.Mocked<NumberConfigurationRepository>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/porting', portingRouter);
    app.use(errorHandler);

    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockPortingRepo = new MockPortingRequestRepository() as jest.Mocked<PortingRequestRepository>;
    mockNumberRepo = new MockVirtualNumberRepository() as jest.Mocked<VirtualNumberRepository>;
    mockConfigRepo = new MockNumberConfigurationRepository() as jest.Mocked<NumberConfigurationRepository>;

    // Mock the constructor calls
    MockPortingRequestRepository.mockImplementation(() => mockPortingRepo);
    MockVirtualNumberRepository.mockImplementation(() => mockNumberRepo);
    MockNumberConfigurationRepository.mockImplementation(() => mockConfigRepo);
  });

  describe('POST /', () => {
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
      notes: 'Test porting request',
    };

    it('should create porting request successfully', async () => {
      const mockPortingRequest = {
        id: 'porting123',
        ...validPortingData,
        status: 'SUBMITTED',
        estimatedCompletion: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPortingRepo.findByCurrentNumber.mockResolvedValue(null);
      mockPortingRepo.create.mockResolvedValue(mockPortingRequest as any);
      mockPortingRepo.addStatusUpdate.mockResolvedValue({} as any);
      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/porting')
        .send(validPortingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.message).toContain('submitted successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        userId: 'user123',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/porting')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Missing required fields');
    });

    it('should return 400 when billing address is incomplete', async () => {
      const invalidData = {
        ...validPortingData,
        billingAddress: {
          street: '123 Main St',
          // Missing city, state, zipCode
        },
      };

      const response = await request(app)
        .post('/api/v1/porting')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Complete billing address is required');
    });
  });

  describe('GET /:id', () => {
    it('should return porting request by ID', async () => {
      const mockPortingRequest = {
        id: 'porting123',
        userId: 'user123',
        currentNumber: '+1234567890',
        status: 'SUBMITTED',
        documents: [],
        statusHistory: [],
      };

      mockPortingRepo.findByIdWithDetails.mockResolvedValue(mockPortingRequest as any);

      const response = await request(app)
        .get('/api/v1/porting/porting123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPortingRequest);
    });

    it('should return 404 when porting request not found', async () => {
      mockPortingRepo.findByIdWithDetails.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/porting/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Porting request not found');
    });
  });

  describe('GET /user/:userId', () => {
    it('should return user porting requests', async () => {
      const mockRequests = [
        {
          id: 'porting123',
          userId: 'user123',
          currentNumber: '+1234567890',
          status: 'SUBMITTED',
          documents: [],
          statusHistory: [],
        },
      ];

      mockPortingRepo.findByUserId.mockResolvedValue(mockRequests as any);
      mockPortingRepo.countByUserId.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/porting/user/user123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRequests);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('PUT /:id/status', () => {
    it('should update porting status successfully', async () => {
      const mockUpdatedRequest = {
        id: 'porting123',
        status: 'PROCESSING',
        updatedAt: new Date(),
      };

      mockPortingRepo.updateStatus.mockResolvedValue(mockUpdatedRequest as any);

      const response = await request(app)
        .put('/api/v1/porting/porting123/status')
        .send({
          status: 'PROCESSING',
          message: 'Porting approved and processing',
          updatedBy: 'admin',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .put('/api/v1/porting/porting123/status')
        .send({
          status: 'PROCESSING',
          // Missing message and updatedBy
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('status, message, and updatedBy are required');
    });

    it('should return 400 when status is invalid', async () => {
      const response = await request(app)
        .put('/api/v1/porting/porting123/status')
        .send({
          status: 'INVALID_STATUS',
          message: 'Test message',
          updatedBy: 'admin',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid status');
    });
  });

  describe('POST /:id/cancel', () => {
    it('should cancel porting request successfully', async () => {
      const mockCancelledRequest = {
        id: 'porting123',
        status: 'CANCELLED',
        updatedAt: new Date(),
      };

      mockPortingRepo.findById.mockResolvedValue({
        id: 'porting123',
        status: 'SUBMITTED',
      } as any);
      mockPortingRepo.updateStatus.mockResolvedValue(mockCancelledRequest as any);

      const response = await request(app)
        .post('/api/v1/porting/porting123/cancel')
        .send({
          reason: 'User requested cancellation',
          cancelledBy: 'user123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/porting/porting123/cancel')
        .send({
          reason: 'User requested cancellation',
          // Missing cancelledBy
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('reason and cancelledBy are required');
    });
  });

  describe('POST /:id/documents', () => {
    it('should upload document successfully', async () => {
      const mockDocument = {
        id: 'doc123',
        portingRequestId: 'porting123',
        type: 'BILL',
        filename: 'bill.pdf',
        url: 'https://example.com/bill.pdf',
        uploadedAt: new Date(),
      };

      mockPortingRepo.findById.mockResolvedValue({
        id: 'porting123',
        status: 'SUBMITTED',
      } as any);
      mockPortingRepo.addDocument.mockResolvedValue(mockDocument as any);

      const response = await request(app)
        .post('/api/v1/porting/porting123/documents')
        .send({
          type: 'BILL',
          filename: 'bill.pdf',
          url: 'https://example.com/bill.pdf',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDocument);
      expect(response.body.message).toContain('uploaded successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/porting/porting123/documents')
        .send({
          type: 'BILL',
          // Missing filename and url
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('type, filename, and url are required');
    });

    it('should return 400 when document type is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/porting/porting123/documents')
        .send({
          type: 'INVALID_TYPE',
          filename: 'document.pdf',
          url: 'https://example.com/document.pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid document type');
    });
  });

  describe('POST /validate', () => {
    it('should validate porting request data', async () => {
      const validationData = {
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

      mockNumberRepo.findByPhoneNumber.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/porting/validate')
        .send(validationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isValid');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('warnings');
    });
  });

  describe('GET /status/:status', () => {
    it('should return porting requests by status', async () => {
      const mockRequests = [
        {
          id: 'porting123',
          status: 'SUBMITTED',
          documents: [],
          statusHistory: [],
        },
      ];

      mockPortingRepo.findByStatus.mockResolvedValue(mockRequests as any);
      mockPortingRepo.countByStatus.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/porting/status/submitted');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRequests);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should return 400 when status is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/porting/status/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid status');
    });
  });
});