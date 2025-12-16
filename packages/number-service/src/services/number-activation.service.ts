import { VirtualNumberRepository } from '../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../repositories/number-configuration.repository';
import { TelecomProviderService } from './telecom-provider.service';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { NumberStatus } from '@voxlink/shared';

export interface ActivationRequest {
  phoneNumber: string;
  userId: string;
  paymentInfo?: {
    paymentMethodId: string;
    billingAddress: any;
  };
  initialConfiguration?: {
    callForwarding?: {
      enabled: boolean;
      primaryDestination?: string;
      timeout?: number;
    };
    voicemail?: {
      enabled: boolean;
      customGreeting?: string;
    };
    businessHours?: {
      timezone: string;
      schedule: any;
    };
  };
}

export interface ActivationResult {
  success: boolean;
  phoneNumber: string;
  activationId: string;
  status: NumberStatus;
  configuration?: any;
  error?: string;
}

export class NumberActivationService {
  private virtualNumberRepo: VirtualNumberRepository;
  private configRepo: NumberConfigurationRepository;
  private telecomProvider: TelecomProviderService;

  constructor() {
    this.virtualNumberRepo = new VirtualNumberRepository();
    this.configRepo = new NumberConfigurationRepository();
    this.telecomProvider = new TelecomProviderService();
  }

  /**
   * Activate a purchased number with default configuration
   */
  async activateNumber(request: ActivationRequest): Promise<ActivationResult> {
    const { phoneNumber, userId, initialConfiguration } = request;

    logger.info('Starting number activation', { phoneNumber, userId });

    try {
      // 1. Verify the number exists and is reserved for this user
      const number = await this.virtualNumberRepo.findByPhoneNumber(phoneNumber);

      if (!number) {
        throw new Error('Phone number not found');
      }

      if (number.status !== 'reserved') {
        throw new Error(`Number is not reserved. Current status: ${number.status}`);
      }

      if (number.ownerId !== userId) {
        throw new Error('Number is not reserved for this user');
      }

      // 2. Activate with telecom provider
      const providerActivation = await this.activateWithProvider(phoneNumber);
      if (!providerActivation.success) {
        throw new Error(`Provider activation failed: ${providerActivation.error}`);
      }

      // 3. Update number status to active
      const updatedNumber = await this.virtualNumberRepo.update(number.id, {
        status: 'active' as const,
        activationDate: new Date(),
      });

      // 4. Create or update configuration
      let configuration = await this.configRepo.findByNumberId(number.id);
      if (!configuration) {
        configuration = await this.createDefaultConfiguration(number.id, initialConfiguration);
      } else {
        configuration = await this.updateConfiguration(number.id, initialConfiguration);
      }

      // 5. Set up call routing with provider
      await this.setupCallRouting(phoneNumber, configuration);

      // 6. Cache activation status
      await this.cacheActivationStatus(phoneNumber, 'active');

      // 7. Send activation confirmation
      await this.sendActivationNotification(phoneNumber, userId);

      const result: ActivationResult = {
        success: true,
        phoneNumber,
        activationId: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'active',
        configuration,
      };

      logger.info('Number activation completed successfully', {
        phoneNumber,
        userId,
        activationId: result.activationId
      });

      return result;
    } catch (error) {
      logger.error('Number activation failed', { error, phoneNumber, userId });

      return {
        success: false,
        phoneNumber,
        activationId: '',
        status: 'reserved',
        error: error instanceof Error ? error.message : 'Unknown activation error',
      };
    }
  }

  /**
   * Deactivate a number
   */
  async deactivateNumber(phoneNumber: string, userId: string): Promise<ActivationResult> {
    logger.info('Starting number deactivation', { phoneNumber, userId });

    try {
      const number = await this.virtualNumberRepo.findByPhoneNumber(phoneNumber);

      if (!number) {
        throw new Error('Phone number not found');
      }

      if (number.ownerId !== userId) {
        throw new Error('Not authorized to deactivate this number');
      }

      // 1. Deactivate with telecom provider
      await this.deactivateWithProvider(phoneNumber);

      // 2. Update number status
      const updatedNumber = await this.virtualNumberRepo.update(number.id, {
        status: 'suspended' as const,
      });

      // 3. Clear cache
      await this.clearActivationCache(phoneNumber);

      // 4. Send deactivation notification
      await this.sendDeactivationNotification(phoneNumber, userId);

      logger.info('Number deactivation completed', { phoneNumber, userId });

      return {
        success: true,
        phoneNumber,
        activationId: '',
        status: 'suspended',
      };
    } catch (error) {
      logger.error('Number deactivation failed', { error, phoneNumber, userId });

      return {
        success: false,
        phoneNumber,
        activationId: '',
        status: 'active',
        error: error instanceof Error ? error.message : 'Unknown deactivation error',
      };
    }
  }

  /**
   * Get activation status
   */
  async getActivationStatus(phoneNumber: string): Promise<{
    status: NumberStatus;
    activatedAt?: Date;
    configuration?: any;
  }> {
    try {
      // Check cache first
      const cachedStatus = await RedisService.get<{
        status: NumberStatus;
        activatedAt?: Date;
        configuration?: any;
      }>(`activation:${phoneNumber}`);
      if (cachedStatus) {
        return cachedStatus;
      }

      // Get from database
      const number = await this.virtualNumberRepo.findByPhoneNumber(phoneNumber);
      if (!number) {
        throw new Error('Phone number not found');
      }

      const result = {
        status: number.status,
        activatedAt: number.activationDate || undefined,
        configuration: number.configuration,
      };

      // Cache the result
      await RedisService.set(`activation:${phoneNumber}`, result, 300); // 5 minutes

      return result;
    } catch (error) {
      logger.error('Failed to get activation status', { error, phoneNumber });
      throw error;
    }
  }

  /**
   * Bulk activate numbers
   */
  async bulkActivateNumbers(requests: ActivationRequest[]): Promise<ActivationResult[]> {
    logger.info('Starting bulk activation', { count: requests.length });

    const results: ActivationResult[] = [];
    const concurrencyLimit = 5; // Process 5 at a time

    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const batch = requests.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(request => this.activateNumber(request));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            phoneNumber: batch[index].phoneNumber,
            activationId: '',
            status: 'reserved',
            error: result.reason?.message || 'Bulk activation failed',
          });
        }
      });
    }

    logger.info('Bulk activation completed', {
      total: requests.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return results;
  }

  /**
   * Private helper methods
   */
  private async activateWithProvider(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would make API calls to the telecom provider
      // For now, we'll simulate the activation process
      logger.info('Activating number with telecom provider', { phoneNumber });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock success (in reality, this could fail)
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Provider activation failed'
      };
    }
  }

  private async deactivateWithProvider(phoneNumber: string): Promise<void> {
    try {
      logger.info('Deactivating number with telecom provider', { phoneNumber });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock deactivation
    } catch (error) {
      logger.error('Provider deactivation failed', { error, phoneNumber });
      throw error;
    }
  }

  private async createDefaultConfiguration(
    numberId: string,
    initialConfig?: ActivationRequest['initialConfiguration']
  ): Promise<any> {
    const defaultConfig = {
      numberId,
      callForwardingEnabled: initialConfig?.callForwarding?.enabled || false,
      primaryDestination: initialConfig?.callForwarding?.primaryDestination,
      forwardingTimeout: initialConfig?.callForwarding?.timeout || 30,
      voicemailEnabled: initialConfig?.voicemail?.enabled !== false, // Default to true
      customGreeting: initialConfig?.voicemail?.customGreeting,
      emailNotifications: true,
      transcriptionEnabled: false,
      maxVoicemailDuration: 180,
      timezone: initialConfig?.businessHours?.timezone || 'UTC',
      businessHoursSchedule: initialConfig?.businessHours?.schedule || this.getDefaultSchedule(),
      holidays: [],
      callNotifications: true,
      smsNotifications: true,
      notificationChannels: ['email'],
    };

    return await this.configRepo.create(defaultConfig);
  }

  private async updateConfiguration(
    numberId: string,
    config?: ActivationRequest['initialConfiguration']
  ): Promise<any> {
    if (!config) {
      return await this.configRepo.findByNumberId(numberId);
    }

    const updateData: any = {};

    if (config.callForwarding) {
      updateData.callForwardingEnabled = config.callForwarding.enabled;
      updateData.primaryDestination = config.callForwarding.primaryDestination;
      updateData.forwardingTimeout = config.callForwarding.timeout;
    }

    if (config.voicemail) {
      updateData.voicemailEnabled = config.voicemail.enabled;
      updateData.customGreeting = config.voicemail.customGreeting;
    }

    if (config.businessHours) {
      updateData.timezone = config.businessHours.timezone;
      updateData.businessHoursSchedule = config.businessHours.schedule;
    }

    return await this.configRepo.update(numberId, updateData);
  }

  private async setupCallRouting(phoneNumber: string, configuration: any): Promise<void> {
    try {
      logger.info('Setting up call routing', { phoneNumber });

      // In a real implementation, this would configure call routing with the telecom provider
      // This might involve setting up SIP endpoints, call forwarding rules, etc.
      if (configuration.callForwardingEnabled && configuration.primaryDestination) {
        logger.info('Configuring call forwarding', {
          phoneNumber,
          destination: configuration.primaryDestination
        });
      }

      if (configuration.voicemailEnabled) {
        logger.info('Configuring voicemail', { phoneNumber });
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logger.error('Failed to setup call routing', { error, phoneNumber });
      throw error;
    }
  }

  private async cacheActivationStatus(phoneNumber: string, status: string): Promise<void> {
    try {
      await RedisService.set(
        `activation:${phoneNumber}`,
        { status, timestamp: new Date() },
        3600
      );
    } catch (error) {
      logger.warn('Failed to cache activation status', { error, phoneNumber });
    }
  }

  private async clearActivationCache(phoneNumber: string): Promise<void> {
    try {
      await RedisService.delete(`activation:${phoneNumber}`);
    } catch (error) {
      logger.warn('Failed to clear activation cache', { error, phoneNumber });
    }
  }

  private async sendActivationNotification(phoneNumber: string, userId: string): Promise<void> {
    try {
      // In a real implementation, this would send email/SMS notifications
      logger.info('Sending activation notification', { phoneNumber, userId });

      // Mock notification sending
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.warn('Failed to send activation notification', { error, phoneNumber, userId });
    }
  }

  private async sendDeactivationNotification(phoneNumber: string, userId: string): Promise<void> {
    try {
      logger.info('Sending deactivation notification', { phoneNumber, userId });

      // Mock notification sending
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.warn('Failed to send deactivation notification', { error, phoneNumber, userId });
    }
  }

  private getDefaultSchedule() {
    return {
      monday: { open: '09:00', close: '17:00', enabled: true },
      tuesday: { open: '09:00', close: '17:00', enabled: true },
      wednesday: { open: '09:00', close: '17:00', enabled: true },
      thursday: { open: '09:00', close: '17:00', enabled: true },
      friday: { open: '09:00', close: '17:00', enabled: true },
      saturday: { open: '10:00', close: '14:00', enabled: false },
      sunday: { open: '10:00', close: '14:00', enabled: false },
    };
  }
}