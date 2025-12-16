import {
  validateVirtualNumber,
  validateNumberConfiguration,
  validateCallForwardingConfig,
} from '../virtual-number.validation';
import { VirtualNumber, NumberConfiguration, CallForwardingConfig } from '../../types/virtual-number';

describe('Virtual Number Validation', () => {
  describe('validateCallForwardingConfig', () => {
    it('should validate enabled call forwarding with primary destination', () => {
      const config: CallForwardingConfig = {
        enabled: true,
        primaryDestination: '+1234567890',
        timeout: 30,
      };

      const result = validateCallForwardingConfig(config);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(config);
    });

    it('should require primary destination when enabled', () => {
      const config = {
        enabled: true,
        timeout: 30,
      };

      const result = validateCallForwardingConfig(config);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('required');
    });

    it('should allow disabled call forwarding without destination', () => {
      const config: CallForwardingConfig = {
        enabled: false,
        timeout: 30,
      };

      const result = validateCallForwardingConfig(config);
      expect(result.error).toBeUndefined();
    });

    it('should validate phone number format', () => {
      const config = {
        enabled: true,
        primaryDestination: 'invalid-phone',
        timeout: 30,
      };

      const result = validateCallForwardingConfig(config);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('E.164 format');
    });

    it('should validate timeout range', () => {
      const config = {
        enabled: true,
        primaryDestination: '+1234567890',
        timeout: 200, // Too high
      };

      const result = validateCallForwardingConfig(config);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('120');
    });
  });

  describe('validateNumberConfiguration', () => {
    const validConfig: NumberConfiguration = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      numberId: '123e4567-e89b-12d3-a456-426614174001',
      callForwarding: {
        enabled: true,
        primaryDestination: '+1234567890',
        timeout: 30,
      },
      voicemail: {
        enabled: true,
        emailNotifications: true,
        transcriptionEnabled: false,
        maxDuration: 180,
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
        holidays: [],
      },
      notifications: {
        callNotifications: true,
        smsNotifications: true,
        emailNotifications: true,
        notificationChannels: ['email', 'sms'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate complete configuration', () => {
      const result = validateNumberConfiguration(validConfig);
      expect(result.error).toBeUndefined();
    });

    it('should require valid UUID for id and numberId', () => {
      const config = {
        ...validConfig,
        id: 'invalid-uuid',
      };

      const result = validateNumberConfiguration(config);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('valid GUID');
    });

    it('should validate business hours time format', () => {
      const config = {
        ...validConfig,
        businessHours: {
          ...validConfig.businessHours,
          schedule: {
            monday: { open: '25:00', close: '17:00', enabled: true }, // Invalid time
          },
        },
      };

      const result = validateNumberConfiguration(config);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateVirtualNumber', () => {
    const validNumber: VirtualNumber = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      phoneNumber: '+1234567890',
      countryCode: 'US',
      areaCode: '123',
      city: 'New York',
      region: 'NY',
      status: 'active',
      ownerId: '123e4567-e89b-12d3-a456-426614174001',
      purchaseDate: new Date(),
      activationDate: new Date(),
      monthlyRate: 1000, // $10.00
      setupFee: 500, // $5.00
      features: ['call_forwarding', 'voicemail'],
      configuration: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        numberId: '123e4567-e89b-12d3-a456-426614174000',
        callForwarding: {
          enabled: true,
          primaryDestination: '+1234567890',
          timeout: 30,
        },
        voicemail: {
          enabled: true,
          emailNotifications: true,
          transcriptionEnabled: false,
          maxDuration: 180,
        },
        businessHours: {
          timezone: 'America/New_York',
          schedule: {
            monday: { open: '09:00', close: '17:00', enabled: true },
          },
          holidays: [],
        },
        notifications: {
          callNotifications: true,
          smsNotifications: true,
          emailNotifications: true,
          notificationChannels: ['email'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate complete virtual number', () => {
      const result = validateVirtualNumber(validNumber);
      expect(result.error).toBeUndefined();
    });

    it('should validate phone number format', () => {
      const number = {
        ...validNumber,
        phoneNumber: 'invalid-phone',
      };

      const result = validateVirtualNumber(number);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('E.164 format');
    });

    it('should validate country code format', () => {
      const number = {
        ...validNumber,
        countryCode: 'USA', // Should be 2 characters
      };

      const result = validateVirtualNumber(number);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('2 characters');
    });

    it('should validate number status', () => {
      const number = {
        ...validNumber,
        status: 'invalid-status' as any,
      };

      const result = validateVirtualNumber(number);
      expect(result.error).toBeDefined();
    });

    it('should validate features array', () => {
      const number = {
        ...validNumber,
        features: ['invalid-feature' as any],
      };

      const result = validateVirtualNumber(number);
      expect(result.error).toBeDefined();
    });
  });
});