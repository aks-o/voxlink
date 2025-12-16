import request from 'supertest';
import { Express } from 'express';
import { setupTestApp } from '../helpers/app-setup';
import { createTestUser, generateAuthToken } from '../helpers/auth-helpers';
import { mockCarrierAPI } from '../helpers/carrier-mock';

describe('Number Porting Workflow E2E', () => {
  let app: Express;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    const user = await createTestUser();
    userId = user.id;
    authToken = generateAuthToken(user);
    mockCarrierAPI.reset();
  });

  describe('Complete number porting process', () => {
    it('should successfully port a number from another carrier', async () => {
      const portingRequest = {
        currentNumber: '+15551234567',
        currentCarrier: 'Verizon',
        accountNumber: 'ACC123456789',
        pin: '1234',
        authorizedName: 'John Doe',
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
      };

      // Step 1: Submit porting request
      const submitResponse = await request(app)
        .post('/api/numbers/porting/request')
        .send(portingRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(submitResponse.body).toMatchObject({
        success: true,
        portingRequestId: expect.any(String),
        status: 'submitted',
        estimatedCompletion: expect.any(String),
      });

      const portingRequestId = submitResponse.body.portingRequestId;

      // Step 2: Upload required documents
      const documentResponse = await request(app)
        .post(`/api/numbers/porting/${portingRequestId}/documents`)
        .attach('billCopy', Buffer.from('mock-bill-pdf'), 'bill.pdf')
        .attach('authorization', Buffer.from('mock-auth-pdf'), 'auth.pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(documentResponse.body).toMatchObject({
        success: true,
        documents: [
          { type: 'billCopy', filename: 'bill.pdf', status: 'uploaded' },
          { type: 'authorization', filename: 'auth.pdf', status: 'uploaded' },
        ],
      });

      // Step 3: Check porting status
      const statusResponse = await request(app)
        .get(`/api/numbers/porting/${portingRequestId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body).toMatchObject({
        status: 'processing',
        currentStep: 'carrier_validation',
        estimatedCompletion: expect.any(String),
        updates: expect.arrayContaining([
          expect.objectContaining({
            step: 'submitted',
            completedAt: expect.any(String),
          }),
        ]),
      });

      // Step 4: Simulate carrier approval (mock)
      mockCarrierAPI.approvePortingRequest(portingRequestId);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Check final status
      const finalStatusResponse = await request(app)
        .get(`/api/numbers/porting/${portingRequestId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalStatusResponse.body).toMatchObject({
        status: 'completed',
        completedAt: expect.any(String),
        portedNumber: {
          phoneNumber: '+15551234567',
          status: 'active',
          ownerId: userId,
        },
      });

      // Step 6: Verify number appears in user's dashboard
      const dashboardResponse = await request(app)
        .get('/api/dashboard/numbers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(dashboardResponse.body.numbers).toContainEqual(
        expect.objectContaining({
          phoneNumber: '+15551234567',
          status: 'active',
          source: 'ported',
        })
      );
    });

    it('should handle porting rejection with clear error messages', async () => {
      const portingRequest = {
        currentNumber: '+15559876543',
        currentCarrier: 'AT&T',
        accountNumber: 'INVALID_ACCOUNT',
        pin: '0000',
        authorizedName: 'Jane Doe',
      };

      // Submit porting request
      const submitResponse = await request(app)
        .post('/api/numbers/porting/request')
        .send(portingRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const portingRequestId = submitResponse.body.portingRequestId;

      // Simulate carrier rejection
      mockCarrierAPI.rejectPortingRequest(portingRequestId, 'Invalid account number');

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check status
      const statusResponse = await request(app)
        .get(`/api/numbers/porting/${portingRequestId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body).toMatchObject({
        status: 'failed',
        error: {
          code: 'CARRIER_REJECTION',
          message: 'Invalid account number',
          suggestions: expect.arrayContaining([
            'Verify your account number with your current carrier',
            'Contact customer support for assistance',
          ]),
        },
      });
    });

    it('should provide real-time status updates during porting', async () => {
      const portingRequest = {
        currentNumber: '+15551111111',
        currentCarrier: 'T-Mobile',
        accountNumber: 'TMO123456',
        pin: '5678',
        authorizedName: 'Bob Smith',
      };

      // Submit porting request
      const submitResponse = await request(app)
        .post('/api/numbers/porting/request')
        .send(portingRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const portingRequestId = submitResponse.body.portingRequestId;

      // Simulate various status updates
      const statusUpdates = [
        'carrier_validation',
        'number_verification',
        'port_scheduling',
        'port_execution',
        'completed',
      ];

      for (const status of statusUpdates) {
        mockCarrierAPI.updatePortingStatus(portingRequestId, status);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await request(app)
          .get(`/api/numbers/porting/${portingRequestId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(statusResponse.body.currentStep).toBe(status);
      }
    });
  });

  describe('Porting validation and requirements', () => {
    it('should validate porting request data', async () => {
      const invalidRequest = {
        currentNumber: 'invalid-number',
        currentCarrier: '',
        accountNumber: '',
        pin: '',
        authorizedName: '',
      };

      const response = await request(app)
        .post('/api/numbers/porting/request')
        .send(invalidRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'currentNumber',
            message: 'Invalid phone number format',
          }),
          expect.objectContaining({
            field: 'currentCarrier',
            message: 'Current carrier is required',
          }),
        ]),
      });
    });

    it('should check number portability before accepting request', async () => {
      const portingRequest = {
        currentNumber: '+15551234567',
        currentCarrier: 'Landline Provider',
        accountNumber: 'LAND123',
        pin: '1234',
        authorizedName: 'Test User',
      };

      // Mock non-portable number
      mockCarrierAPI.setNumberPortability('+15551234567', false);

      const response = await request(app)
        .post('/api/numbers/porting/request')
        .send(portingRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NUMBER_NOT_PORTABLE',
          message: 'This number cannot be ported to VoxLink',
          alternatives: expect.arrayContaining([
            'Consider purchasing a new number in the same area code',
          ]),
        },
      });
    });
  });

  describe('Porting timeline and notifications', () => {
    it('should provide accurate timeline estimates', async () => {
      const portingRequest = {
        currentNumber: '+15552222222',
        currentCarrier: 'Sprint',
        accountNumber: 'SPR123456',
        pin: '9999',
        authorizedName: 'Alice Johnson',
      };

      const response = await request(app)
        .post('/api/numbers/porting/request')
        .send(portingRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const estimatedCompletion = new Date(response.body.estimatedCompletion);
      const now = new Date();
      const daysDifference = Math.ceil(
        (estimatedCompletion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Porting should typically take 3-7 business days
      expect(daysDifference).toBeGreaterThanOrEqual(3);
      expect(daysDifference).toBeLessThanOrEqual(7);
    });

    it('should send notifications for porting status changes', async () => {
      const portingRequest = {
        currentNumber: '+15553333333',
        currentCarrier: 'Verizon',
        accountNumber: 'VZW123456',
        pin: '4444',
        authorizedName: 'Charlie Brown',
      };

      const submitResponse = await request(app)
        .post('/api/numbers/porting/request')
        .send(portingRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const portingRequestId = submitResponse.body.portingRequestId;

      // Check notifications were sent
      const notificationsResponse = await request(app)
        .get('/api/notifications')
        .query({ type: 'porting', relatedId: portingRequestId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(notificationsResponse.body.notifications).toContainEqual(
        expect.objectContaining({
          type: 'porting_submitted',
          title: 'Porting Request Submitted',
          message: expect.stringContaining('+15553333333'),
        })
      );
    });
  });
});