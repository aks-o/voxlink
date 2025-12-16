import request from 'supertest';
import { Express } from 'express';
import { setupTestApp } from '../helpers/app-setup';
import { createTestUser, generateAuthToken } from '../helpers/auth-helpers';
import { mockTelecomProvider } from '../helpers/telecom-mock';

describe('Number Acquisition Workflow E2E', () => {
  let app: Express;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    const user = await createTestUser();
    userId = user.id;
    authToken = generateAuthToken(user);
    mockTelecomProvider.reset();
  });

  describe('Complete number search and purchase flow', () => {
    it('should allow user to search, reserve, and purchase a virtual number', async () => {
      // Step 1: Search for available numbers
      const searchResponse = await request(app)
        .get('/api/numbers/search')
        .query({
          country: 'US',
          areaCode: '555',
          pattern: '555-*-****'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body.numbers).toHaveLength(10);
      expect(searchResponse.body.numbers[0]).toMatchObject({
        phoneNumber: expect.stringMatching(/^\+1555\d{7}$/),
        countryCode: 'US',
        areaCode: '555',
        monthlyRate: expect.any(Number),
        setupFee: expect.any(Number),
      });

      const selectedNumber = searchResponse.body.numbers[0];

      // Step 2: Reserve the selected number
      const reservationResponse = await request(app)
        .post('/api/numbers/reserve')
        .send({ numberId: selectedNumber.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(reservationResponse.body).toMatchObject({
        reservationId: expect.any(String),
        expiresAt: expect.any(String),
        number: selectedNumber,
      });

      const reservationId = reservationResponse.body.reservationId;

      // Step 3: Purchase the reserved number
      const purchaseResponse = await request(app)
        .post('/api/numbers/purchase')
        .send({
          reservationId,
          paymentMethod: {
            type: 'card',
            token: 'test_card_token',
          },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(purchaseResponse.body).toMatchObject({
        success: true,
        number: {
          id: selectedNumber.id,
          status: 'purchased',
          ownerId: userId,
        },
        transaction: {
          id: expect.any(String),
          amount: selectedNumber.setupFee + selectedNumber.monthlyRate,
          status: 'completed',
        },
      });

      // Step 4: Verify number activation
      const activationResponse = await request(app)
        .get(`/api/numbers/${selectedNumber.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(activationResponse.body).toMatchObject({
        status: 'active',
        activatedAt: expect.any(String),
        configuration: {
          callForwarding: {
            enabled: true,
            primaryDestination: expect.any(String),
          },
        },
      });

      // Step 5: Verify number appears in user's dashboard
      const dashboardResponse = await request(app)
        .get('/api/dashboard/numbers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(dashboardResponse.body.numbers).toContainEqual(
        expect.objectContaining({
          id: selectedNumber.id,
          status: 'active',
          ownerId: userId,
        })
      );
    });

    it('should handle reservation timeout correctly', async () => {
      // Search for a number
      const searchResponse = await request(app)
        .get('/api/numbers/search')
        .query({ country: 'US', areaCode: '555' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const selectedNumber = searchResponse.body.numbers[0];

      // Reserve the number
      const reservationResponse = await request(app)
        .post('/api/numbers/reserve')
        .send({ numberId: selectedNumber.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const reservationId = reservationResponse.body.reservationId;

      // Wait for reservation to expire (simulate by advancing time)
      jest.advanceTimersByTime(11 * 60 * 1000); // 11 minutes

      // Try to purchase expired reservation
      await request(app)
        .post('/api/numbers/purchase')
        .send({
          reservationId,
          paymentMethod: { type: 'card', token: 'test_card_token' },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Verify number is available again
      const searchAgainResponse = await request(app)
        .get('/api/numbers/search')
        .query({ country: 'US', areaCode: '555' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchAgainResponse.body.numbers).toContainEqual(
        expect.objectContaining({ id: selectedNumber.id })
      );
    });

    it('should handle payment failures gracefully', async () => {
      // Search and reserve a number
      const searchResponse = await request(app)
        .get('/api/numbers/search')
        .query({ country: 'US', areaCode: '555' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const selectedNumber = searchResponse.body.numbers[0];

      const reservationResponse = await request(app)
        .post('/api/numbers/reserve')
        .send({ numberId: selectedNumber.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Attempt purchase with invalid payment method
      const purchaseResponse = await request(app)
        .post('/api/numbers/purchase')
        .send({
          reservationId: reservationResponse.body.reservationId,
          paymentMethod: { type: 'card', token: 'invalid_card_token' },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(purchaseResponse.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'PAYMENT_FAILED',
          message: expect.any(String),
        }),
      });

      // Verify reservation is still valid
      const statusResponse = await request(app)
        .get(`/api/numbers/reservations/${reservationResponse.body.reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('active');
    });
  });

  describe('Number search performance', () => {
    it('should return search results within 3 seconds', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/numbers/search')
        .query({ country: 'US', areaCode: '555' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000);
    });

    it('should handle concurrent search requests', async () => {
      const searchPromises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/numbers/search')
          .query({ country: 'US', areaCode: '555' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      );

      const responses = await Promise.all(searchPromises);

      responses.forEach(response => {
        expect(response.body.numbers).toHaveLength(10);
      });
    });
  });
});