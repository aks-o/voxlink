import request from 'supertest';
import { Express } from 'express';
import { setupTestApp } from '../../e2e/helpers/app-setup';
import { createTestUser, generateAuthToken } from '../../e2e/helpers/auth-helpers';
import { createTestNumber } from '../../e2e/helpers/number-helpers';

describe('Number Service ↔ Billing Service Contract', () => {
  let numberServiceApp: Express;
  let billingServiceApp: Express;
  let authToken: string;
  let userId: string;
  let testNumber: any;

  beforeAll(async () => {
    numberServiceApp = await setupTestApp('number-service');
    billingServiceApp = await setupTestApp('billing-service');
    
    const user = await createTestUser();
    userId = user.id;
    authToken = generateAuthToken(user);
    testNumber = await createTestNumber(userId);
  });

  describe('Usage Event Tracking Contract', () => {
    it('should send usage events from number service to billing service', async () => {
      // Simulate an inbound call on the number service
      const callData = {
        numberId: testNumber.id,
        eventType: 'inbound_call',
        duration: 120, // 2 minutes
        from: '+1987654321',
        to: testNumber.phoneNumber,
        timestamp: new Date().toISOString(),
      };

      // Number service records the call
      const callResponse = await request(numberServiceApp)
        .post(`/api/numbers/${testNumber.id}/calls`)
        .send(callData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(callResponse.body).toMatchObject({
        success: true,
        callId: expect.any(String),
        usageEventId: expect.any(String),
      });

      // Wait for usage event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify billing service received the usage event
      const usageResponse = await request(billingServiceApp)
        .get(`/api/billing/usage/${testNumber.id}`)
        .query({
          startDate: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          endDate: new Date().toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(usageResponse.body.usageRecords).toContainEqual(
        expect.objectContaining({
          numberId: testNumber.id,
          eventType: 'inbound_call',
          duration: 120,
          cost: expect.any(Number),
        })
      );
    });

    it('should handle SMS usage events correctly', async () => {
      const smsData = {
        numberId: testNumber.id,
        eventType: 'sms_received',
        from: '+1987654321',
        to: testNumber.phoneNumber,
        message: 'Test SMS message',
        timestamp: new Date().toISOString(),
      };

      // Number service processes SMS
      const smsResponse = await request(numberServiceApp)
        .post(`/api/numbers/${testNumber.id}/sms`)
        .send(smsData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(smsResponse.body).toMatchObject({
        success: true,
        messageId: expect.any(String),
        usageEventId: expect.any(String),
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify billing service tracked the SMS
      const usageResponse = await request(billingServiceApp)
        .get(`/api/billing/usage/${testNumber.id}`)
        .query({
          eventType: 'sms_received',
          startDate: new Date(Date.now() - 60000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(usageResponse.body.usageRecords).toContainEqual(
        expect.objectContaining({
          numberId: testNumber.id,
          eventType: 'sms_received',
          cost: expect.any(Number),
        })
      );
    });

    it('should handle usage event failures gracefully', async () => {
      // Simulate billing service being unavailable
      const invalidCallData = {
        numberId: 'invalid-number-id',
        eventType: 'inbound_call',
        duration: 60,
        from: '+1987654321',
        to: '+15551234567',
        timestamp: new Date().toISOString(),
      };

      // Number service should handle the error gracefully
      const response = await request(numberServiceApp)
        .post('/api/numbers/invalid-number-id/calls')
        .send(invalidCallData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NUMBER_NOT_FOUND',
          message: expect.any(String),
        },
      });
    });
  });

  describe('Billing Status Contract', () => {
    it('should check billing status before number operations', async () => {
      // Billing service should provide account status
      const billingStatusResponse = await request(billingServiceApp)
        .get(`/api/billing/accounts/${userId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(billingStatusResponse.body).toMatchObject({
        accountId: userId,
        status: expect.stringMatching(/^(active|suspended|overdue)$/),
        currentBalance: expect.any(Number),
        outstandingAmount: expect.any(Number),
        nextBillingDate: expect.any(String),
      });

      // Number service should respect billing status
      if (billingStatusResponse.body.status === 'suspended') {
        const numberOperationResponse = await request(numberServiceApp)
          .post(`/api/numbers/${testNumber.id}/configuration`)
          .send({
            callForwarding: {
              enabled: true,
              primaryDestination: '+1234567890',
            },
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(numberOperationResponse.body).toMatchObject({
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: expect.any(String),
          },
        });
      }
    });

    it('should handle payment method validation', async () => {
      // Test number purchase with payment validation
      const purchaseData = {
        numberId: 'new-number-id',
        paymentMethod: {
          type: 'card',
          token: 'test_card_token',
        },
      };

      // Number service should validate payment with billing service
      const purchaseResponse = await request(numberServiceApp)
        .post('/api/numbers/purchase')
        .send(purchaseData)
        .set('Authorization', `Bearer ${authToken}`);

      if (purchaseResponse.status === 400) {
        expect(purchaseResponse.body).toMatchObject({
          success: false,
          error: {
            code: expect.stringMatching(/^(PAYMENT_METHOD_INVALID|INSUFFICIENT_FUNDS|NUMBER_NOT_FOUND)$/),
            message: expect.any(String),
          },
        });
      } else {
        expect(purchaseResponse.status).toBe(200);
        expect(purchaseResponse.body).toMatchObject({
          success: true,
          transaction: {
            id: expect.any(String),
            amount: expect.any(Number),
            status: 'completed',
          },
        });
      }
    });
  });

  describe('Cost Calculation Contract', () => {
    it('should provide consistent cost calculations', async () => {
      const usageData = {
        eventType: 'inbound_call',
        duration: 180, // 3 minutes
        country: 'US',
        numberType: 'local',
      };

      // Get cost calculation from billing service
      const costResponse = await request(billingServiceApp)
        .post('/api/billing/calculate-cost')
        .send(usageData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(costResponse.body).toMatchObject({
        eventType: 'inbound_call',
        duration: 180,
        cost: expect.any(Number),
        currency: 'USD',
        breakdown: {
          baseCost: expect.any(Number),
          durationCost: expect.any(Number),
          taxes: expect.any(Number),
        },
      });

      // Number service should use the same calculation
      const numberCostResponse = await request(numberServiceApp)
        .post('/api/numbers/calculate-usage-cost')
        .send(usageData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(numberCostResponse.body.cost).toBe(costResponse.body.cost);
    });

    it('should handle different pricing tiers', async () => {
      const pricingTiers = [
        { eventType: 'inbound_call', duration: 60, country: 'US' },
        { eventType: 'outbound_call', duration: 60, country: 'US' },
        { eventType: 'sms_received', country: 'US' },
        { eventType: 'sms_sent', country: 'US' },
        { eventType: 'inbound_call', duration: 60, country: 'UK' },
      ];

      const costPromises = pricingTiers.map(tier =>
        request(billingServiceApp)
          .post('/api/billing/calculate-cost')
          .send(tier)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      );

      const costResponses = await Promise.all(costPromises);

      // Verify different costs for different tiers
      const costs = costResponses.map(r => r.body.cost);
      const uniqueCosts = [...new Set(costs)];
      
      expect(uniqueCosts.length).toBeGreaterThan(1); // Should have different costs
      
      // International calls should be more expensive
      const usCost = costResponses[0].body.cost;
      const ukCost = costResponses[4].body.cost;
      expect(ukCost).toBeGreaterThan(usCost);
    });
  });

  describe('Invoice Generation Contract', () => {
    it('should generate invoices with number usage data', async () => {
      // Create some usage events
      const usageEvents = [
        {
          numberId: testNumber.id,
          eventType: 'inbound_call',
          duration: 120,
          from: '+1987654321',
          timestamp: new Date().toISOString(),
        },
        {
          numberId: testNumber.id,
          eventType: 'sms_received',
          from: '+1987654321',
          timestamp: new Date().toISOString(),
        },
      ];

      // Submit usage events
      for (const event of usageEvents) {
        await request(numberServiceApp)
          .post(`/api/numbers/${testNumber.id}/usage`)
          .send(event)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate invoice
      const invoiceResponse = await request(billingServiceApp)
        .post(`/api/billing/accounts/${userId}/generate-invoice`)
        .send({
          period: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
            end: new Date().toISOString(),
          },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(invoiceResponse.body).toMatchObject({
        invoiceId: expect.any(String),
        accountId: userId,
        period: {
          start: expect.any(String),
          end: expect.any(String),
        },
        lineItems: expect.arrayContaining([
          expect.objectContaining({
            description: expect.stringContaining(testNumber.phoneNumber),
            quantity: expect.any(Number),
            unitPrice: expect.any(Number),
            totalPrice: expect.any(Number),
          }),
        ]),
        subtotal: expect.any(Number),
        taxes: expect.any(Number),
        total: expect.any(Number),
      });

      // Verify invoice contains usage from our test number
      const numberLineItems = invoiceResponse.body.lineItems.filter((item: any) =>
        item.description.includes(testNumber.phoneNumber)
      );
      expect(numberLineItems.length).toBeGreaterThan(0);
    });
  });
});