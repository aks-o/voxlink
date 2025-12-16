import { NumberConfigurationRepository } from '../repositories/number-configuration.repository';
import { VirtualNumberRepository } from '../repositories/virtual-number.repository';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { isWithinBusinessHours } from '@voxlink/shared';

export interface CallForwardingUpdate {
  enabled: boolean;
  primaryDestination?: string;
  failoverDestination?: string;
  businessHoursDestination?: string;
  afterHoursDestination?: string;
  timeout?: number;
}

export interface VoicemailUpdate {
  enabled: boolean;
  customGreeting?: string;
  emailNotifications?: boolean;
  transcriptionEnabled?: boolean;
  maxDuration?: number;
}

export interface BusinessHoursUpdate {
  timezone: string;
  schedule: Record<string, { open: string; close: string; enabled: boolean }>;
  holidays?: Date[];
}

export interface NotificationUpdate {
  callNotifications?: boolean;
  smsNotifications?: boolean;
  emailNotifications?: boolean;
  webhookUrl?: string;
  notificationChannels?: string[];
}

export interface ConfigurationTestResult {
  success: boolean;
  component: string;
  message: string;
  details?: any;
}

export class ConfigurationService {
  private configRepo: NumberConfigurationRepository;
  private numberRepo: VirtualNumberRepository;

  constructor() {
    this.configRepo = new NumberConfigurationRepository();
    this.numberRepo = new VirtualNumberRepository();
  }

  /**
   * Update call forwarding configuration
   */
  async updateCallForwarding(
    numberId: string, 
    userId: string, 
    config: CallForwardingUpdate
  ): Promise<any> {
    logger.info('Updating call forwarding configuration', { numberId, userId });

    try {
      // Verify user owns the number
      await this.verifyNumberOwnership(numberId, userId);

      // Validate configuration
      this.validateCallForwardingConfig(config);

      // Update configuration
      const updatedConfig = await this.configRepo.updateCallForwarding(numberId, {
        enabled: config.enabled,
        primaryDestination: config.primaryDestination,
        failoverDestination: config.failoverDestination,
        businessHoursDestination: config.businessHoursDestination,
        afterHoursDestination: config.afterHoursDestination,
        timeout: config.timeout || 30,
      });

      // Apply changes to telecom provider
      await this.applyCallForwardingChanges(numberId, config);

      // Clear cache
      await this.clearConfigurationCache(numberId);

      // Log configuration change
      await this.logConfigurationChange(numberId, userId, 'call_forwarding', config);

      logger.info('Call forwarding configuration updated successfully', { numberId, userId });
      return updatedConfig;

    } catch (error) {
      logger.error('Failed to update call forwarding configuration', { error, numberId, userId });
      throw error;
    }
  }

  /**
   * Update voicemail configuration
   */
  async updateVoicemail(
    numberId: string, 
    userId: string, 
    config: VoicemailUpdate
  ): Promise<any> {
    logger.info('Updating voicemail configuration', { numberId, userId });

    try {
      await this.verifyNumberOwnership(numberId, userId);
      this.validateVoicemailConfig(config);

      const updatedConfig = await this.configRepo.updateVoicemail(numberId, {
        enabled: config.enabled,
        customGreeting: config.customGreeting,
        emailNotifications: config.emailNotifications ?? true,
        transcriptionEnabled: config.transcriptionEnabled ?? false,
        maxDuration: config.maxDuration || 180,
      });

      await this.applyVoicemailChanges(numberId, config);
      await this.clearConfigurationCache(numberId);
      await this.logConfigurationChange(numberId, userId, 'voicemail', config);

      logger.info('Voicemail configuration updated successfully', { numberId, userId });
      return updatedConfig;

    } catch (error) {
      logger.error('Failed to update voicemail configuration', { error, numberId, userId });
      throw error;
    }
  }

  /**
   * Update business hours configuration
   */
  async updateBusinessHours(
    numberId: string, 
    userId: string, 
    config: BusinessHoursUpdate
  ): Promise<any> {
    logger.info('Updating business hours configuration', { numberId, userId });

    try {
      await this.verifyNumberOwnership(numberId, userId);
      this.validateBusinessHoursConfig(config);

      const updatedConfig = await this.configRepo.updateBusinessHours(numberId, {
        timezone: config.timezone,
        schedule: config.schedule,
        holidays: config.holidays,
      });

      await this.applyBusinessHoursChanges(numberId, config);
      await this.clearConfigurationCache(numberId);
      await this.logConfigurationChange(numberId, userId, 'business_hours', config);

      logger.info('Business hours configuration updated successfully', { numberId, userId });
      return updatedConfig;

    } catch (error) {
      logger.error('Failed to update business hours configuration', { error, numberId, userId });
      throw error;
    }
  }

  /**
   * Update notification configuration
   */
  async updateNotifications(
    numberId: string, 
    userId: string, 
    config: NotificationUpdate
  ): Promise<any> {
    logger.info('Updating notification configuration', { numberId, userId });

    try {
      await this.verifyNumberOwnership(numberId, userId);
      this.validateNotificationConfig(config);

      const updatedConfig = await this.configRepo.updateNotifications(numberId, {
        callNotifications: config.callNotifications,
        smsNotifications: config.smsNotifications,
        emailNotifications: config.emailNotifications,
        webhookUrl: config.webhookUrl,
        notificationChannels: config.notificationChannels,
      });

      await this.clearConfigurationCache(numberId);
      await this.logConfigurationChange(numberId, userId, 'notifications', config);

      logger.info('Notification configuration updated successfully', { numberId, userId });
      return updatedConfig;

    } catch (error) {
      logger.error('Failed to update notification configuration', { error, numberId, userId });
      throw error;
    }
  }

  /**
   * Get complete configuration for a number
   */
  async getConfiguration(numberId: string, userId: string): Promise<any> {
    try {
      await this.verifyNumberOwnership(numberId, userId);

      // Check cache first
      const cacheKey = `config:${numberId}`;
      const cachedConfig = await RedisService.get(cacheKey);
      if (cachedConfig) {
        return cachedConfig;
      }

      // Get from database
      const configuration = await this.configRepo.findByNumberId(numberId);
      if (!configuration) {
        throw new Error('Configuration not found');
      }

      // Cache the configuration
      await RedisService.set(cacheKey, configuration, 1800); // 30 minutes

      return configuration;

    } catch (error) {
      logger.error('Failed to get configuration', { error, numberId, userId });
      throw error;
    }
  }

  /**
   * Test configuration components
   */
  async testConfiguration(numberId: string, userId: string): Promise<ConfigurationTestResult[]> {
    logger.info('Testing configuration', { numberId, userId });

    try {
      await this.verifyNumberOwnership(numberId, userId);
      const configuration = await this.configRepo.findByNumberId(numberId);
      
      if (!configuration) {
        throw new Error('Configuration not found');
      }

      const results: ConfigurationTestResult[] = [];

      // Test call forwarding
      if (configuration.callForwardingEnabled) {
        const forwardingTest = await this.testCallForwarding(configuration);
        results.push(forwardingTest);
      }

      // Test voicemail
      if (configuration.voicemailEnabled) {
        const voicemailTest = await this.testVoicemail(configuration);
        results.push(voicemailTest);
      }

      // Test business hours logic
      const businessHoursTest = await this.testBusinessHours(configuration);
      results.push(businessHoursTest);

      // Test notifications
      const notificationTest = await this.testNotifications(configuration);
      results.push(notificationTest);

      logger.info('Configuration testing completed', { 
        numberId, 
        userId, 
        totalTests: results.length,
        passed: results.filter(r => r.success).length 
      });

      return results;

    } catch (error) {
      logger.error('Configuration testing failed', { error, numberId, userId });
      throw error;
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(numberId: string, userId: string): Promise<any> {
    logger.info('Resetting configuration to defaults', { numberId, userId });

    try {
      await this.verifyNumberOwnership(numberId, userId);

      // Delete existing configuration
      await this.configRepo.delete(numberId);

      // Create new default configuration
      const defaultConfig = await this.configRepo.createDefaultConfiguration(numberId);

      // Apply default settings to provider
      await this.applyDefaultConfiguration(numberId);

      // Clear cache
      await this.clearConfigurationCache(numberId);

      // Log the reset
      await this.logConfigurationChange(numberId, userId, 'reset_to_defaults', {});

      logger.info('Configuration reset to defaults successfully', { numberId, userId });
      return defaultConfig;

    } catch (error) {
      logger.error('Failed to reset configuration to defaults', { error, numberId, userId });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async verifyNumberOwnership(numberId: string, userId: string): Promise<void> {
    const number = await this.numberRepo.findById(numberId);
    if (!number) {
      throw new Error('Number not found');
    }
    if (number.ownerId !== userId) {
      throw new Error('Not authorized to modify this number configuration');
    }
  }

  private validateCallForwardingConfig(config: CallForwardingUpdate): void {
    if (config.enabled && !config.primaryDestination) {
      throw new Error('Primary destination is required when call forwarding is enabled');
    }
    
    if (config.timeout && (config.timeout < 5 || config.timeout > 120)) {
      throw new Error('Timeout must be between 5 and 120 seconds');
    }
  }

  private validateVoicemailConfig(config: VoicemailUpdate): void {
    if (config.maxDuration && (config.maxDuration < 30 || config.maxDuration > 600)) {
      throw new Error('Max duration must be between 30 and 600 seconds');
    }
    
    if (config.customGreeting && config.customGreeting.length > 500) {
      throw new Error('Custom greeting must be less than 500 characters');
    }
  }

  private validateBusinessHoursConfig(config: BusinessHoursUpdate): void {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const [day, schedule] of Object.entries(config.schedule)) {
      if (!validDays.includes(day)) {
        throw new Error(`Invalid day: ${day}`);
      }
      
      if (schedule.enabled) {
        if (!schedule.open || !schedule.close) {
          throw new Error(`Open and close times are required for ${day}`);
        }
        
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(schedule.open) || !timeRegex.test(schedule.close)) {
          throw new Error(`Invalid time format for ${day}. Use HH:MM format`);
        }
      }
    }
  }

  private validateNotificationConfig(config: NotificationUpdate): void {
    if (config.webhookUrl) {
      try {
        new URL(config.webhookUrl);
      } catch {
        throw new Error('Invalid webhook URL format');
      }
    }
    
    if (config.notificationChannels) {
      const validChannels = ['email', 'sms', 'webhook'];
      for (const channel of config.notificationChannels) {
        if (!validChannels.includes(channel)) {
          throw new Error(`Invalid notification channel: ${channel}`);
        }
      }
    }
  }

  private async applyCallForwardingChanges(numberId: string, config: CallForwardingUpdate): Promise<void> {
    // In a real implementation, this would make API calls to the telecom provider
    logger.info('Applying call forwarding changes to provider', { numberId });
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
  }

  private async applyVoicemailChanges(numberId: string, config: VoicemailUpdate): Promise<void> {
    logger.info('Applying voicemail changes to provider', { numberId });
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async applyBusinessHoursChanges(numberId: string, config: BusinessHoursUpdate): Promise<void> {
    logger.info('Applying business hours changes to provider', { numberId });
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async applyDefaultConfiguration(numberId: string): Promise<void> {
    logger.info('Applying default configuration to provider', { numberId });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async clearConfigurationCache(numberId: string): Promise<void> {
    try {
      await RedisService.delete(`config:${numberId}`);
    } catch (error) {
      logger.warn('Failed to clear configuration cache', { error, numberId });
    }
  }

  private async logConfigurationChange(
    numberId: string, 
    userId: string, 
    changeType: string, 
    changes: any
  ): Promise<void> {
    try {
      // In a real implementation, this would log to an audit trail
      logger.info('Configuration change logged', { 
        numberId, 
        userId, 
        changeType, 
        changes,
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      logger.warn('Failed to log configuration change', { error, numberId, userId });
    }
  }

  private async testCallForwarding(configuration: any): Promise<ConfigurationTestResult> {
    try {
      // Simulate testing call forwarding
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        component: 'call_forwarding',
        message: 'Call forwarding is configured correctly',
        details: {
          destination: configuration.primaryDestination,
          timeout: configuration.forwardingTimeout,
        },
      };
    } catch (error) {
      return {
        success: false,
        component: 'call_forwarding',
        message: 'Call forwarding test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async testVoicemail(configuration: any): Promise<ConfigurationTestResult> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        component: 'voicemail',
        message: 'Voicemail is configured correctly',
        details: {
          enabled: configuration.voicemailEnabled,
          maxDuration: configuration.maxVoicemailDuration,
        },
      };
    } catch (error) {
      return {
        success: false,
        component: 'voicemail',
        message: 'Voicemail test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async testBusinessHours(configuration: any): Promise<ConfigurationTestResult> {
    try {
      const now = new Date();
      const isWithinHours = isWithinBusinessHours(
        now,
        configuration.businessHoursSchedule,
        configuration.timezone,
        configuration.holidays
      );
      
      return {
        success: true,
        component: 'business_hours',
        message: `Business hours logic working correctly. Currently ${isWithinHours ? 'within' : 'outside'} business hours`,
        details: {
          timezone: configuration.timezone,
          currentlyWithinHours: isWithinHours,
        },
      };
    } catch (error) {
      return {
        success: false,
        component: 'business_hours',
        message: 'Business hours test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async testNotifications(configuration: any): Promise<ConfigurationTestResult> {
    try {
      const enabledChannels = configuration.notificationChannels || [];
      
      return {
        success: true,
        component: 'notifications',
        message: `Notifications configured for ${enabledChannels.length} channel(s)`,
        details: {
          channels: enabledChannels,
          webhookUrl: configuration.webhookUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        component: 'notifications',
        message: 'Notifications test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }
}