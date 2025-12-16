import request from 'supertest';
import { Express } from 'express';
import { setupTestApp } from '../helpers/app-setup';
import { createTestUser, generateAuthToken } from '../helpers/auth-helpers';
import { createTestNumber } from '../helpers/number-helpers';

describe('Number Configuration Workflow E2E', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let testNumber: any;

  beforeAll(async () => {
    app = await setupTestApp();
    const user = await createTestUser();
    userId = user.id;
    authToken = generateAuthToken(user);
    testNumber = await createTestNumber(userId);
  });

  describe('Call forwarding configuration', () => {
    it('should configure call forwarding with business hours', async () => {
      const configurationData = {
        callForwarding: {
          enabled: true,
          primaryDestination: '+1234567890',
          failoverDestination: '+1987654321',
          businessHoursDestination: '+1234567890',
          afterHoursDestination: '+1555123456',
          timeout: 30,
        },
        businessHours: {
          timezone: 'America/New_York',
          schedule: {
            monday: { open: '09:00', close: '17:00', enabled: true },
            tuesday: { open: '09:00', close: '17:00', enabled: true },
            wednesday: { open: '09:00', close: '17:00', enabled: true },
            thursday: { open: '09:00', close: '17:00', enabled: true },
            friday: { open: '09:00', close: '17:00', enabled: true },
            saturday: { open: '10:00', close: '14:00', enabled: true },
            sunday: { open: '10:00', close: '14:00', enabled: false },
          },
          holidays: ['2024-12-25', '2024-01-01'],
        },
      };

      const response = await request(app)
        .put(`/api/numbers/${testNumber.id}/configuration`)
        .send(configurationData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        configuration: configurationData,
        appliedAt: expect.any(String),
      });

      // Verify configuration was saved
      const getConfigResponse = await request(app)
        .get(`/api/numbers/${testNumber.id}/configuration`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getConfigResponse.body).toMatchObject(configurationData);
    });

    it('should test call forwarding configuration', async () => {
      // Configure call forwarding
      await request(app)
        .put(`/api/numbers/${testNumber.id}/configuration`)
        .send({
          callForwarding: {
            enabled: true,
            primaryDestination: '+1234567890',
            timeout: 20,
          },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Test the configuration
      const testResponse = await request(app)
        .post(`/api/numbers/${testNumber.id}/test-configuration`)
        .send({ testType: 'call_forwarding' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(testResponse.body).toMatchObject({
        success: true,
        testResults: {
          callForwarding: {
            status: 'success',
            destination: '+1234567890',
            responseTime: expect.any(Number),
          },
        },
      });
    });

    it('should handle invalid forwarding numbers', async () => {
      const invalidConfig = {
        callForwarding: {
          enabled: true,
          primaryDestination: 'invalid-number',
        },
      };

      const response = await request(app)
        .put(`/api/numbers/${testNumber.id}/configuration`)
        .send(invalidConfig)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_PHONE_NUMBER',
          field: 'callForwarding.primaryDestination',
        },
      });
    });
  });

  describe('Voicemail configuration', () => {
    it('should configure voicemail with custom greeting', async () => {
      const voicemailConfig = {
        voicemail: {
          enabled: true,
          greeting: 'custom',
          customGreetingText: 'Thank you for calling VoxLink. Please leave a message.',
          emailNotifications: true,
          transcription: true,
          maxDuration: 300,
        },
      };

      const response = await request(app)
        .put(`/api/numbers/${testNumber.id}/configuration`)
        .send(voicemailConfig)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.configuration.voicemail).toMatchObject(
        voicemailConfig.voicemail
      );

      // Test voicemail configuration
      const testResponse = await request(app)
        .post(`/api/numbers/${testNumber.id}/test-configuration`)
        .send({ testType: 'voicemail' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(testResponse.body.testResults.voicemail.status).toBe('success');
    });

    it('should upload custom greeting audio file', async () => {
      // Mock file upload
      const response = await request(app)
        .post(`/api/numbers/${testNumber.id}/voicemail/greeting`)
        .attach('greeting', Buffer.from('mock-audio-data'), 'greeting.wav')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        greetingUrl: expect.stringContaining('greeting.wav'),
      });
    });
  });

  describe('Configuration changes tracking', () => {
    it('should track configuration changes with audit log', async () => {
      // Make initial configuration
      await request(app)
        .put(`/api/numbers/${testNumber.id}/configuration`)
        .send({
          callForwarding: {
            enabled: true,
            primaryDestination: '+1234567890',
          },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Update configuration
      await request(app)
        .put(`/api/numbers/${testNumber.id}/configuration`)
        .send({
          callForwarding: {
            enabled: true,
            primaryDestination: '+1987654321',
          },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check audit log
      const auditResponse = await request(app)
        .get(`/api/numbers/${testNumber.id}/audit-log`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(auditResponse.body.changes).toHaveLength(2);
      expect(auditResponse.body.changes[0]).toMatchObject({
        field: 'callForwarding.primaryDestination',
        oldValue: '+1234567890',
        newValue: '+1987654321',
        changedBy: userId,
        changedAt: expect.any(String),
      });
    });

    it('should apply configuration changes within 30 seconds', async () => {
      const startTime = Date.now();

      await request(app)
        .put(`/api/numbers/${testNumber.id}/configuration`)
        .send({
          callForwarding: {
            enabled: true,
            primaryDestination: '+1555999888',
          },
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Wait a moment and check if configuration is active
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await request(app)
        .get(`/api/numbers/${testNumber.id}/configuration/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(statusResponse.body.status).toBe('active');
      expect(totalTime).toBeLessThan(30000);
    });
  });
});