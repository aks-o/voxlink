"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceService = void 0;
const logger_1 = require("../utils/logger");
class PreferenceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create notification preferences for user
     */
    async createPreferences(input) {
        try {
            const preference = await this.prisma.notificationPreference.create({
                data: {
                    userId: input.userId,
                    emailEnabled: input.emailEnabled ?? true,
                    smsEnabled: input.smsEnabled ?? true,
                    pushEnabled: input.pushEnabled ?? true,
                    webhookEnabled: input.webhookEnabled ?? false,
                    email: input.email,
                    phoneNumber: input.phoneNumber,
                    webhookUrl: input.webhookUrl,
                    callNotifications: input.callNotifications ?? true,
                    smsNotifications: input.smsNotifications ?? true,
                    billingNotifications: input.billingNotifications ?? true,
                    systemNotifications: input.systemNotifications ?? true,
                    portingNotifications: input.portingNotifications ?? true,
                    quietHoursEnabled: input.quietHoursEnabled ?? false,
                    quietHoursStart: input.quietHoursStart,
                    quietHoursEnd: input.quietHoursEnd,
                    quietHoursTimezone: input.quietHoursTimezone ?? 'UTC',
                },
            });
            logger_1.logger.info('Notification preferences created', {
                userId: input.userId,
                preferenceId: preference.id,
            });
            return preference;
        }
        catch (error) {
            logger_1.logger.error('Failed to create notification preferences', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: input.userId,
            });
            throw error;
        }
    }
    /**
     * Get notification preferences for user
     */
    async getPreferences(userId) {
        return this.prisma.notificationPreference.findUnique({
            where: { userId },
        });
    }
    /**
     * Update notification preferences
     */
    async updatePreferences(userId, updates) {
        try {
            const preference = await this.prisma.notificationPreference.upsert({
                where: { userId },
                update: updates,
                create: {
                    userId,
                    ...updates,
                },
            });
            logger_1.logger.info('Notification preferences updated', {
                userId,
                preferenceId: preference.id,
                updates: Object.keys(updates),
            });
            return preference;
        }
        catch (error) {
            logger_1.logger.error('Failed to update notification preferences', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                updates,
            });
            throw error;
        }
    }
    /**
     * Delete notification preferences
     */
    async deletePreferences(userId) {
        try {
            await this.prisma.notificationPreference.delete({
                where: { userId },
            });
            logger_1.logger.info('Notification preferences deleted', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete notification preferences', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
            throw error;
        }
    }
    /**
     * Enable/disable specific notification type
     */
    async toggleNotificationType(userId, type, enabled) {
        const updateData = {};
        switch (type) {
            case 'call':
                updateData.callNotifications = enabled;
                break;
            case 'sms':
                updateData.smsNotifications = enabled;
                break;
            case 'billing':
                updateData.billingNotifications = enabled;
                break;
            case 'system':
                updateData.systemNotifications = enabled;
                break;
            case 'porting':
                updateData.portingNotifications = enabled;
                break;
            default:
                throw new Error(`Unknown notification type: ${type}`);
        }
        return this.updatePreferences(userId, updateData);
    }
    /**
     * Enable/disable specific channel
     */
    async toggleChannel(userId, channel, enabled) {
        const updateData = {};
        switch (channel) {
            case 'email':
                updateData.emailEnabled = enabled;
                break;
            case 'sms':
                updateData.smsEnabled = enabled;
                break;
            case 'push':
                updateData.pushEnabled = enabled;
                break;
            case 'webhook':
                updateData.webhookEnabled = enabled;
                break;
            default:
                throw new Error(`Unknown channel: ${channel}`);
        }
        return this.updatePreferences(userId, updateData);
    }
    /**
     * Update contact information
     */
    async updateContactInfo(userId, contactInfo) {
        return this.updatePreferences(userId, contactInfo);
    }
    /**
     * Configure quiet hours
     */
    async configureQuietHours(userId, config) {
        return this.updatePreferences(userId, {
            quietHoursEnabled: config.enabled,
            quietHoursStart: config.start,
            quietHoursEnd: config.end,
            quietHoursTimezone: config.timezone,
        });
    }
    /**
     * Get default preferences for new user
     */
    getDefaultPreferences(userId) {
        return {
            userId,
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            webhookEnabled: false,
            callNotifications: true,
            smsNotifications: true,
            billingNotifications: true,
            systemNotifications: true,
            portingNotifications: true,
            quietHoursEnabled: false,
            quietHoursTimezone: 'UTC',
        };
    }
    /**
     * Validate preference data
     */
    validatePreferences(input) {
        const errors = [];
        // Validate email format
        if (input.email && !this.isValidEmail(input.email)) {
            errors.push('Invalid email format');
        }
        // Validate phone number format
        if (input.phoneNumber && !this.isValidPhoneNumber(input.phoneNumber)) {
            errors.push('Invalid phone number format');
        }
        // Validate webhook URL
        if (input.webhookUrl && !this.isValidUrl(input.webhookUrl)) {
            errors.push('Invalid webhook URL format');
        }
        // Validate quiet hours format
        if (input.quietHoursStart && !this.isValidTimeFormat(input.quietHoursStart)) {
            errors.push('Invalid quiet hours start time format (use HH:MM)');
        }
        if (input.quietHoursEnd && !this.isValidTimeFormat(input.quietHoursEnd)) {
            errors.push('Invalid quiet hours end time format (use HH:MM)');
        }
        return errors;
    }
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate phone number format (E.164)
     */
    isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
    /**
     * Validate URL format
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        }
        catch {
            return false;
        }
    }
    /**
     * Validate time format (HH:MM)
     */
    isValidTimeFormat(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
}
exports.PreferenceService = PreferenceService;
