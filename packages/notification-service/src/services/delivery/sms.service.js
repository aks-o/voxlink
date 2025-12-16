"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSService = void 0;
const twilio_1 = require("twilio");
const config_1 = require("../../config/config");
const logger_1 = require("../../utils/logger");
class SMSService {
    constructor() {
        this.client = new twilio_1.Twilio(config_1.config.sms.twilio.accountSid, config_1.config.sms.twilio.authToken);
    }
    /**
     * Send SMS notification
     */
    async sendSMS(input) {
        try {
            const from = input.from || config_1.config.sms.twilio.fromNumber;
            if (!from) {
                throw new Error('No SMS from number configured');
            }
            const message = await this.client.messages.create({
                body: input.content,
                from: from,
                to: input.to,
            });
            logger_1.logger.info('SMS sent successfully', {
                to: input.to,
                messageId: message.sid,
                status: message.status,
            });
            return {
                success: true,
                messageId: message.sid,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send SMS', {
                error: error instanceof Error ? error.message : 'Unknown error',
                to: input.to,
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Get message status
     */
    async getMessageStatus(messageId) {
        try {
            const message = await this.client.messages(messageId).fetch();
            return message.status;
        }
        catch (error) {
            logger_1.logger.error('Failed to get SMS status', {
                error: error instanceof Error ? error.message : 'Unknown error',
                messageId,
            });
            return null;
        }
    }
    /**
     * Send test SMS
     */
    async sendTestSMS(to) {
        return this.sendSMS({
            to,
            content: `VoxLink SMS Service Test - ${new Date().toISOString()}`,
        });
    }
    /**
     * Validate phone number format
     */
    validatePhoneNumber(phoneNumber) {
        // Basic E.164 format validation
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phoneNumber);
    }
    /**
     * Format phone number to E.164
     */
    formatPhoneNumber(phoneNumber, countryCode = '+1') {
        // Remove all non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');
        // If it starts with country code, return as is
        if (digits.length > 10 && digits.startsWith('1')) {
            return `+${digits}`;
        }
        // If it's a 10-digit US number, add country code
        if (digits.length === 10) {
            return `${countryCode}${digits}`;
        }
        // Return original if we can't format it
        return phoneNumber;
    }
}
exports.SMSService = SMSService;
