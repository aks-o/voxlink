"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberActivationService = void 0;
const virtual_number_repository_1 = require("../repositories/virtual-number.repository");
const number_configuration_repository_1 = require("../repositories/number-configuration.repository");
const telecom_provider_service_1 = require("./telecom-provider.service");
const redis_service_1 = require("./redis.service");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class NumberActivationService {
    constructor() {
        this.virtualNumberRepo = new virtual_number_repository_1.VirtualNumberRepository();
        this.configRepo = new number_configuration_repository_1.NumberConfigurationRepository();
        this.telecomProvider = new telecom_provider_service_1.TelecomProviderService();
    }
    /**
     * Activate a purchased number with default configuration
     */
    async activateNumber(request) {
        const { phoneNumber, userId, initialConfiguration } = request;
        logger_1.logger.info('Starting number activation', { phoneNumber, userId });
        try {
            // 1. Verify the number exists and is reserved for this user
            const number = await this.virtualNumberRepo.findByPhoneNumber(phoneNumber);
            if (!number) {
                throw new Error('Phone number not found');
            }
            if (number.status !== client_1.NumberStatus.RESERVED) {
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
                status: client_1.NumberStatus.ACTIVE,
                activationDate: new Date(),
            });
            // 4. Create or update configuration
            let configuration = await this.configRepo.findByNumberId(number.id);
            if (!configuration) {
                configuration = await this.createDefaultConfiguration(number.id, initialConfiguration);
            }
            else {
                configuration = await this.updateConfiguration(number.id, initialConfiguration);
            }
            // 5. Set up call routing with provider
            await this.setupCallRouting(phoneNumber, configuration);
            // 6. Cache activation status
            await this.cacheActivationStatus(phoneNumber, 'active');
            // 7. Send activation confirmation
            await this.sendActivationNotification(phoneNumber, userId);
            const result = {
                success: true,
                phoneNumber,
                activationId: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: client_1.NumberStatus.ACTIVE,
                configuration,
            };
            logger_1.logger.info('Number activation completed successfully', {
                phoneNumber,
                userId,
                activationId: result.activationId
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Number activation failed', { error, phoneNumber, userId });
            return {
                success: false,
                phoneNumber,
                activationId: '',
                status: client_1.NumberStatus.RESERVED,
                error: error instanceof Error ? error.message : 'Unknown activation error',
            };
        }
    }
    /**
     * Deactivate a number
     */
    async deactivateNumber(phoneNumber, userId) {
        logger_1.logger.info('Starting number deactivation', { phoneNumber, userId });
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
                status: client_1.NumberStatus.SUSPENDED,
            });
            // 3. Clear cache
            await this.clearActivationCache(phoneNumber);
            // 4. Send deactivation notification
            await this.sendDeactivationNotification(phoneNumber, userId);
            logger_1.logger.info('Number deactivation completed', { phoneNumber, userId });
            return {
                success: true,
                phoneNumber,
                activationId: '',
                status: client_1.NumberStatus.SUSPENDED,
            };
        }
        catch (error) {
            logger_1.logger.error('Number deactivation failed', { error, phoneNumber, userId });
            return {
                success: false,
                phoneNumber,
                activationId: '',
                status: client_1.NumberStatus.ACTIVE,
                error: error instanceof Error ? error.message : 'Unknown deactivation error',
            };
        }
    }
    /**
     * Get activation status
     */
    async getActivationStatus(phoneNumber) {
        try {
            // Check cache first
            const cachedStatus = await redis_service_1.RedisService.get(`activation:${phoneNumber}`);
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
            await redis_service_1.RedisService.set(`activation:${phoneNumber}`, result, 300); // 5 minutes
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get activation status', { error, phoneNumber });
            throw error;
        }
    }
    /**
     * Bulk activate numbers
     */
    async bulkActivateNumbers(requests) {
        logger_1.logger.info('Starting bulk activation', { count: requests.length });
        const results = [];
        const concurrencyLimit = 5; // Process 5 at a time
        for (let i = 0; i < requests.length; i += concurrencyLimit) {
            const batch = requests.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(request => this.activateNumber(request));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    results.push({
                        success: false,
                        phoneNumber: batch[index].phoneNumber,
                        activationId: '',
                        status: client_1.NumberStatus.RESERVED,
                        error: result.reason?.message || 'Bulk activation failed',
                    });
                }
            });
        }
        logger_1.logger.info('Bulk activation completed', {
            total: requests.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
        });
        return results;
    }
    /**
     * Private helper methods
     */
    async activateWithProvider(phoneNumber) {
        try {
            // In a real implementation, this would make API calls to the telecom provider
            // For now, we'll simulate the activation process
            logger_1.logger.info('Activating number with telecom provider', { phoneNumber });
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Mock success (in reality, this could fail)
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Provider activation failed'
            };
        }
    }
    async deactivateWithProvider(phoneNumber) {
        try {
            logger_1.logger.info('Deactivating number with telecom provider', { phoneNumber });
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            // Mock deactivation
        }
        catch (error) {
            logger_1.logger.error('Provider deactivation failed', { error, phoneNumber });
            throw error;
        }
    }
    async createDefaultConfiguration(numberId, initialConfig) {
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
    async updateConfiguration(numberId, config) {
        if (!config) {
            return await this.configRepo.findByNumberId(numberId);
        }
        const updateData = {};
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
    async setupCallRouting(phoneNumber, configuration) {
        try {
            logger_1.logger.info('Setting up call routing', { phoneNumber });
            // In a real implementation, this would configure call routing with the telecom provider
            // This might involve setting up SIP endpoints, call forwarding rules, etc.
            if (configuration.callForwardingEnabled && configuration.primaryDestination) {
                logger_1.logger.info('Configuring call forwarding', {
                    phoneNumber,
                    destination: configuration.primaryDestination
                });
            }
            if (configuration.voicemailEnabled) {
                logger_1.logger.info('Configuring voicemail', { phoneNumber });
            }
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        catch (error) {
            logger_1.logger.error('Failed to setup call routing', { error, phoneNumber });
            throw error;
        }
    }
    async cacheActivationStatus(phoneNumber, status) {
        try {
            await redis_service_1.RedisService.set(`activation:${phoneNumber}`, { status, timestamp: new Date() }, 3600);
        }
        catch (error) {
            logger_1.logger.warn('Failed to cache activation status', { error, phoneNumber });
        }
    }
    async clearActivationCache(phoneNumber) {
        try {
            await redis_service_1.RedisService.delete(`activation:${phoneNumber}`);
        }
        catch (error) {
            logger_1.logger.warn('Failed to clear activation cache', { error, phoneNumber });
        }
    }
    async sendActivationNotification(phoneNumber, userId) {
        try {
            // In a real implementation, this would send email/SMS notifications
            logger_1.logger.info('Sending activation notification', { phoneNumber, userId });
            // Mock notification sending
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        catch (error) {
            logger_1.logger.warn('Failed to send activation notification', { error, phoneNumber, userId });
        }
    }
    async sendDeactivationNotification(phoneNumber, userId) {
        try {
            logger_1.logger.info('Sending deactivation notification', { phoneNumber, userId });
            // Mock notification sending
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        catch (error) {
            logger_1.logger.warn('Failed to send deactivation notification', { error, phoneNumber, userId });
        }
    }
    getDefaultSchedule() {
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
exports.NumberActivationService = NumberActivationService;
