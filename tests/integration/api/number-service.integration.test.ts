import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createTestApp, createAuthToken, createTestUser } from '../helpers/app-setup';

describe('Number Service API Integration', () => {
  let app: Express;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp('number-service');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    await prisma.$connect();

    // Create test users and tokens
    const user = createTestUser();
    const adminUser = createTestUser({ role: 'admin', id: '2', email: 'admin@example.com' });
    authToken = createAuthToken(user);
    adminToken = createAuthToken(adminUser);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.virtualNumber.deleteMany();
    await prisma.usageRecord.deleteMany();
    await prisma.portingRequest.deleteMany();
  });

  describe('GET /numbers/search', () => {
    beforeEach(async () => {
      // Seed test data
      await prisma.virtualNumber.createMany({
        data: [
          {
            phoneNumber: '+1234567890',
            countryCode: 'US',
            areaCode: '123',
            city: 'New York',
            state: 'NY',
            status: 'AVAILABLE',
            features: ['SMS', 'VOICE'],
            monthlyPrice: 5.00,
            setupPrice: 0.00,
            provider: 'twilio',
          },
          {
            phoneNumber: '+1234567891',
            countryCode: 'US',
            areaCode: '123',
            city: 'New York',
            state: 'NY',
            status: 'AVAILABLE',
            features: ['SMS', 'VOICE', 'MMS'],
            monthlyPrice: 7.00,
            setupPrice: 0.00,
            provider: 'bandwidth',
          },
          {
            phoneNumber: '+1987654321',
            countryCode: 'US',
            areaCode: '987',
            city: 'Los Angeles',
            state: 'CA',
            status: 'RESERVED',
            features: ['SMS', 'VOICE'],
            monthlyPrice: 5.00,
            setupPrice: 0.00,
            provider: 'twilio',
          },
        ],
      });
    });

    it('should search numbers by country code', async () => {
      const response = await request(app)
        .get('/numbers/search')
        .query({ countryCode: 'US' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2); // Only available numbers
      expect(response.body.data[0]).toHaveProperty('phoneNumber');
      expect(response.body.data[0]).toHaveProperty('countryCode', 'US');
      expect(response.body.data[0]).toHaveProperty('status', 'AVAILABLE');
    });

    it('should search numbers by area code', async () => {
      const response = await request(app)
        .get('/numbers/search')
        .query({ countryCode: 'US', areaCode: '123' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((n: any) => n.areaCode === '123')).toBe(true);
    });

    it('should filter by features', async () => {
      const response = await request(app)
        .get('/numbers/search')
        .query({ countryCode: 'US', features: 'MMS' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].features).toContain('MMS');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/numbers/search')
        .query({ countryCode: 'US', limit: 1, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toHaveProperty('total', 2);
      expect(response.body.pagination).toHaveProperty('limit', 1);
      expect(response.body.pagination).toHaveProperty('offset', 0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/numbers/search')
        .query({ countryCode: 'US' })
        .expect(401);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/numbers/search')
        .query({ countryCode: 'INVALID' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('countryCode');
    });
  });

  describe('POST /numbers/purchase', () => {
    let availableNumber: any;

    beforeEach(async () => {
      availableNumber = await prisma.virtualNumber.create({
        data: {
          phoneNumber: '+1234567890',
          countryCode: 'US',
          areaCode: '123',
          city: 'New York',
          state: 'NY',
          status: 'AVAILABLE',
          features: ['SMS', 'VOICE'],
          monthlyPrice: 5.00,
          setupPrice: 0.00,
          provider: 'twilio',
        },
      });
    });

    it('should purchase an available number', async () => {
      const response = await request(app)
        .post('/numbers/purchase')
        .send({
          numberId: availableNumber.id,
          userId: '1',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
      expect(response.body.data).toHaveProperty('ownerId', '1');

      // Verify database update
      const updatedNumber = await prisma.virtualNumber.findUnique({
        where: { id: availableNumber.id },
      });
      expect(updatedNumber?.status).toBe('ACTIVE');
      expect(updatedNumber?.ownerId).toBe('1');
    });

    it('should not purchase unavailable number', async () => {
      // Mark number as reserved
      await prisma.virtualNumber.update({
        where: { id: availableNumber.id },
        data: { status: 'RESERVED' },
      });

      const response = await request(app)
        .post('/numbers/purchase')
        .send({
          numberId: availableNumber.id,
          userId: '1',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not available');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/numbers/purchase')
        .send({
          // Missing required fields
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle non-existent number', async () => {
      const response = await request(app)
        .post('/numbers/purchase')
        .send({
          numberId: 'non-existent-id',
          userId: '1',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /numbers/:id/configuration', () => {
    let ownedNumber: any;

    beforeEach(async () => {
      ownedNumber = await prisma.virtualNumber.create({
        data: {
          phoneNumber: '+1234567890',
          countryCode: 'US',
          areaCode: '123',
          city: 'New York',
          state: 'NY',
          status: 'ACTIVE',
          features: ['SMS', 'VOICE'],
          monthlyPrice: 5.00,
          setupPrice: 0.00,
          provider: 'twilio',
          ownerId: '1',
        },
      });

      await prisma.numberConfiguration.create({
        data: {
          numberId: ownedNumber.id,
          forwardingEnabled: true,
          forwardingNumber: '+1987654321',
          smsEnabled: true,
          voiceEnabled: true,
          recordingEnabled: false,
        },
      });
    });

    it('should get number configuration for owner', async () => {
      const response = await request(app)
        .get(`/numbers/${ownedNumber.id}/configuration`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('forwardingEnabled', true);
      expect(response.body.data).toHaveProperty('forwardingNumber', '+1987654321');
      expect(response.body.data).toHaveProperty('smsEnabled', true);
      expect(response.body.data).toHaveProperty('voiceEnabled', true);
    });

    it('should not allow access to non-owned number', async () => {
      // Create number owned by different user
      const otherUserNumber = await prisma.virtualNumber.create({
        data: {
          phoneNumber: '+1987654321',
          countryCode: 'US',
          areaCode: '987',
          city: 'Los Angeles',
          state: 'CA',
          status: 'ACTIVE',
          features: ['SMS', 'VOICE'],
          monthlyPrice: 5.00,
          setupPrice: 0.00,
          provider: 'twilio',
          ownerId: '999', // Different user
        },
      });

      const response = await request(app)
        .get(`/numbers/${otherUserNumber.id}/configuration`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('access denied');
    });

    it('should allow admin access to any number', async () => {
      const response = await request(app)
        .get(`/numbers/${ownedNumber.id}/configuration`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('forwardingEnabled', true);
    });
  });

  describe('Performance tests', () => {
    beforeEach(async () => {
      // Create test data for performance tests
      const numbers = Array.from({ length: 100 }, (_, i) => ({
        phoneNumber: `+123456${String(i).padStart(4, '0')}`,
        countryCode: 'US',
        areaCode: '123',
        city: 'New York',
        state: 'NY',
        status: 'AVAILABLE',
        features: ['SMS', 'VOICE'],
        monthlyPrice: 5.00,
        setupPrice: 0.00,
        provider: i % 2 === 0 ? 'twilio' : 'bandwidth',
      }));

      await prisma.virtualNumber.createMany({ data: numbers });
    });

    it('should handle search requests within acceptable time', async () => {
      const start = process.hrtime.bigint();

      const response = await request(app)
        .get('/numbers/search')
        .query({ countryCode: 'US', limit: 50 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      expect(response.body.data).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle high-frequency requests', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(app)
          .get('/numbers/search')
          .query({ countryCode: 'US', limit: 10 })
          .set('Authorization', `Bearer ${authToken}`)
      );

      const start = process.hrtime.bigint();
      const responses = await Promise.all(requests);
      const end = process.hrtime.bigint();

      const duration = Number(end - start) / 1000000;
      const avgResponseTime = duration / requests.length;

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(avgResponseTime).toBeLessThan(200); // Average response time under 200ms
    });
  });
});