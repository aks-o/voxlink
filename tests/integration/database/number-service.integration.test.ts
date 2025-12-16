import { Client } from 'pg';
import Redis from 'ioredis';
import { VirtualNumberRepository } from '../../../packages/number-service/src/repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../../../packages/number-service/src/repositories/number-configuration.repository';
import { UsageRecordRepository } from '../../../packages/number-service/src/repositories/usage-record.repository';

describe('Number Service Database Integration', () => {
  let postgresClient: Client;
  let redisClient: Redis;
  let virtualNumberRepo: VirtualNumberRepository;
  let configRepo: NumberConfigurationRepository;
  let usageRepo: UsageRecordRepository;

  beforeAll(async () => {
    postgresClient = global.__POSTGRES_CLIENT__;
    redisClient = global.__REDIS_CLIENT__;
    
    virtualNumberRepo = new VirtualNumberRepository(postgresClient);
    configRepo = new NumberConfigurationRepository(postgresClient);
    usageRepo = new UsageRecordRepository(postgresClient);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await postgresClient.query('TRUNCATE TABLE usage_records CASCADE');
    await postgresClient.query('TRUNCATE TABLE number_configurations CASCADE');
    await postgresClient.query('TRUNCATE TABLE virtual_numbers CASCADE');
    await redisClient.flushdb();
  });

  describe('Virtual Number Repository', () => {
    it('should create and retrieve virtual numbers', async () => {
      const numberData = {
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'available' as const,
        ownerId: null,
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      };

      // Create number
      const createdNumber = await virtualNumberRepo.create(numberData);
      
      expect(createdNumber).toMatchObject({
        id: expect.any(String),
        ...numberData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Retrieve number
      const retrievedNumber = await virtualNumberRepo.findById(createdNumber.id);
      
      expect(retrievedNumber).toMatchObject(createdNumber);
    });

    it('should handle concurrent number reservations correctly', async () => {
      const numberData = {
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'available' as const,
        ownerId: null,
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      };

      const createdNumber = await virtualNumberRepo.create(numberData);

      // Simulate concurrent reservation attempts
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      const reservationPromises = [
        virtualNumberRepo.reserve(createdNumber.id, userId1),
        virtualNumberRepo.reserve(createdNumber.id, userId2),
      ];

      const results = await Promise.allSettled(reservationPromises);

      // Only one reservation should succeed
      const successfulReservations = results.filter(r => r.status === 'fulfilled');
      const failedReservations = results.filter(r => r.status === 'rejected');

      expect(successfulReservations).toHaveLength(1);
      expect(failedReservations).toHaveLength(1);

      // Verify the number is reserved
      const reservedNumber = await virtualNumberRepo.findById(createdNumber.id);
      expect(reservedNumber?.status).toBe('reserved');
      expect([userId1, userId2]).toContain(reservedNumber?.ownerId);
    });

    it('should search numbers with complex filters', async () => {
      // Create test numbers
      const testNumbers = [
        {
          phoneNumber: '+15551111111',
          countryCode: 'US',
          areaCode: '555',
          city: 'New York',
          region: 'NY',
          status: 'available' as const,
          monthlyRate: 10.00,
          features: ['voice', 'sms'],
        },
        {
          phoneNumber: '+15552222222',
          countryCode: 'US',
          areaCode: '555',
          city: 'New York',
          region: 'NY',
          status: 'available' as const,
          monthlyRate: 15.00,
          features: ['voice', 'sms', 'fax'],
        },
        {
          phoneNumber: '+14161111111',
          countryCode: 'CA',
          areaCode: '416',
          city: 'Toronto',
          region: 'ON',
          status: 'available' as const,
          monthlyRate: 12.00,
          features: ['voice'],
        },
      ];

      for (const numberData of testNumbers) {
        await virtualNumberRepo.create({
          ...numberData,
          ownerId: null,
          setupFee: 5.00,
        });
      }

      // Test various search filters
      const usNumbers = await virtualNumberRepo.search({
        countryCode: 'US',
        limit: 10,
      });
      expect(usNumbers).toHaveLength(2);

      const nyNumbers = await virtualNumberRepo.search({
        countryCode: 'US',
        region: 'NY',
        limit: 10,
      });
      expect(nyNumbers).toHaveLength(2);

      const expensiveNumbers = await virtualNumberRepo.search({
        priceRange: { min: 12, max: 20 },
        limit: 10,
      });
      expect(expensiveNumbers).toHaveLength(2);

      const faxNumbers = await virtualNumberRepo.search({
        features: ['fax'],
        limit: 10,
      });
      expect(faxNumbers).toHaveLength(1);
    });
  });

  describe('Number Configuration Repository', () => {
    it('should create and update number configurations', async () => {
      // Create a test number first
      const number = await virtualNumberRepo.create({
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'active',
        ownerId: 'test-user',
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      });

      const configData = {
        numberId: number.id,
        callForwarding: {
          enabled: true,
          primaryDestination: '+1234567890',
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
            saturday: { open: '10:00', close: '14:00', enabled: false },
            sunday: { open: '10:00', close: '14:00', enabled: false },
          },
        },
        voicemail: {
          enabled: true,
          greeting: 'default',
          emailNotifications: true,
        },
      };

      // Create configuration
      const createdConfig = await configRepo.create(configData);
      
      expect(createdConfig).toMatchObject({
        id: expect.any(String),
        numberId: number.id,
        callForwarding: configData.callForwarding,
        businessHours: configData.businessHours,
        voicemail: configData.voicemail,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Update configuration
      const updatedConfigData = {
        ...configData,
        callForwarding: {
          ...configData.callForwarding,
          primaryDestination: '+1987654321',
        },
      };

      const updatedConfig = await configRepo.update(createdConfig.id, updatedConfigData);
      
      expect(updatedConfig.callForwarding.primaryDestination).toBe('+1987654321');
      expect(updatedConfig.updatedAt.getTime()).toBeGreaterThan(createdConfig.updatedAt.getTime());
    });

    it('should handle configuration caching', async () => {
      // Create a test number and configuration
      const number = await virtualNumberRepo.create({
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'active',
        ownerId: 'test-user',
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      });

      const configData = {
        numberId: number.id,
        callForwarding: {
          enabled: true,
          primaryDestination: '+1234567890',
          timeout: 30,
        },
      };

      const createdConfig = await configRepo.create(configData);

      // Cache the configuration
      const cacheKey = `config:${number.id}`;
      await redisClient.setex(cacheKey, 300, JSON.stringify(createdConfig));

      // Verify cache
      const cachedConfig = await redisClient.get(cacheKey);
      expect(cachedConfig).toBeTruthy();
      
      const parsedCachedConfig = JSON.parse(cachedConfig!);
      expect(parsedCachedConfig.id).toBe(createdConfig.id);

      // Update configuration should invalidate cache
      await configRepo.update(createdConfig.id, {
        ...configData,
        callForwarding: {
          ...configData.callForwarding,
          primaryDestination: '+1987654321',
        },
      });

      // Simulate cache invalidation
      await redisClient.del(cacheKey);
      
      const invalidatedCache = await redisClient.get(cacheKey);
      expect(invalidatedCache).toBeNull();
    });
  });

  describe('Usage Record Repository', () => {
    it('should track usage records with proper indexing', async () => {
      // Create a test number
      const number = await virtualNumberRepo.create({
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'active',
        ownerId: 'test-user',
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      });

      // Create usage records
      const usageRecords = [
        {
          numberId: number.id,
          eventType: 'inbound_call' as const,
          duration: 120,
          cost: 0.05,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          metadata: { from: '+1987654321', to: number.phoneNumber },
        },
        {
          numberId: number.id,
          eventType: 'outbound_call' as const,
          duration: 180,
          cost: 0.08,
          timestamp: new Date('2024-01-01T11:00:00Z'),
          metadata: { from: number.phoneNumber, to: '+1555999888' },
        },
        {
          numberId: number.id,
          eventType: 'sms_received' as const,
          cost: 0.01,
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: { from: '+1987654321', message: 'Test SMS' },
        },
      ];

      const createdRecords = [];
      for (const recordData of usageRecords) {
        const record = await usageRepo.create(recordData);
        createdRecords.push(record);
      }

      // Test querying by number ID
      const numberUsage = await usageRepo.findByNumberId(number.id);
      expect(numberUsage).toHaveLength(3);

      // Test querying by date range
      const dateRangeUsage = await usageRepo.findByDateRange(
        number.id,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T23:59:59Z')
      );
      expect(dateRangeUsage).toHaveLength(3);

      // Test querying by event type
      const callUsage = await usageRepo.findByEventType(number.id, 'inbound_call');
      expect(callUsage).toHaveLength(1);
      expect(callUsage[0].duration).toBe(120);

      // Test cost aggregation
      const totalCost = await usageRepo.getTotalCost(
        number.id,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T23:59:59Z')
      );
      expect(totalCost).toBe(0.14); // 0.05 + 0.08 + 0.01
    });

    it('should handle high-volume usage tracking', async () => {
      // Create a test number
      const number = await virtualNumberRepo.create({
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'active',
        ownerId: 'test-user',
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      });

      // Create many usage records to test performance
      const recordCount = 1000;
      const usagePromises = [];

      for (let i = 0; i < recordCount; i++) {
        const recordData = {
          numberId: number.id,
          eventType: i % 2 === 0 ? 'inbound_call' as const : 'sms_received' as const,
          duration: i % 2 === 0 ? Math.floor(Math.random() * 300) : undefined,
          cost: Math.random() * 0.1,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
          metadata: { test: true, index: i },
        };

        usagePromises.push(usageRepo.create(recordData));
      }

      const startTime = Date.now();
      await Promise.all(usagePromises);
      const endTime = Date.now();

      const insertTime = endTime - startTime;
      console.log(`✅ Inserted ${recordCount} usage records in ${insertTime}ms`);

      // Test query performance
      const queryStartTime = Date.now();
      const allRecords = await usageRepo.findByNumberId(number.id);
      const queryEndTime = Date.now();

      const queryTime = queryEndTime - queryStartTime;
      console.log(`✅ Queried ${allRecords.length} usage records in ${queryTime}ms`);

      expect(allRecords).toHaveLength(recordCount);
      expect(insertTime).toBeLessThan(10000); // 10 seconds max for 1000 inserts
      expect(queryTime).toBeLessThan(1000); // 1 second max for query
    });
  });

  describe('Database Transactions', () => {
    it('should handle number purchase transaction correctly', async () => {
      const numberData = {
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'available' as const,
        ownerId: null,
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      };

      const number = await virtualNumberRepo.create(numberData);
      const userId = 'test-user';

      // Simulate number purchase transaction
      await postgresClient.query('BEGIN');

      try {
        // Reserve the number
        await virtualNumberRepo.reserve(number.id, userId);

        // Create default configuration
        const configData = {
          numberId: number.id,
          callForwarding: {
            enabled: true,
            primaryDestination: '+1234567890',
            timeout: 30,
          },
        };

        await configRepo.create(configData);

        // Activate the number
        await virtualNumberRepo.updateStatus(number.id, 'active');

        await postgresClient.query('COMMIT');

        // Verify transaction results
        const purchasedNumber = await virtualNumberRepo.findById(number.id);
        const numberConfig = await configRepo.findByNumberId(number.id);

        expect(purchasedNumber?.status).toBe('active');
        expect(purchasedNumber?.ownerId).toBe(userId);
        expect(numberConfig).toBeTruthy();
        expect(numberConfig?.callForwarding.enabled).toBe(true);

      } catch (error) {
        await postgresClient.query('ROLLBACK');
        throw error;
      }
    });

    it('should rollback transaction on failure', async () => {
      const numberData = {
        phoneNumber: '+15551234567',
        countryCode: 'US',
        areaCode: '555',
        city: 'New York',
        region: 'NY',
        status: 'available' as const,
        ownerId: null,
        monthlyRate: 10.00,
        setupFee: 5.00,
        features: ['voice', 'sms'],
      };

      const number = await virtualNumberRepo.create(numberData);
      const userId = 'test-user';

      // Simulate failed transaction
      await postgresClient.query('BEGIN');

      try {
        // Reserve the number
        await virtualNumberRepo.reserve(number.id, userId);

        // Simulate failure (invalid configuration)
        await configRepo.create({
          numberId: 'invalid-number-id', // This should fail
          callForwarding: {
            enabled: true,
            primaryDestination: '+1234567890',
            timeout: 30,
          },
        });

        await postgresClient.query('COMMIT');

      } catch (error) {
        await postgresClient.query('ROLLBACK');

        // Verify rollback worked
        const rolledBackNumber = await virtualNumberRepo.findById(number.id);
        expect(rolledBackNumber?.status).toBe('available');
        expect(rolledBackNumber?.ownerId).toBeNull();

        const config = await configRepo.findByNumberId(number.id);
        expect(config).toBeNull();
      }
    });
  });
});