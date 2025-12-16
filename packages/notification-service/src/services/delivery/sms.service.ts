import { Twilio } from 'twilio';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';

export interface SMSDeliveryInput {
  to: string;
  content: string;
  from?: string;
}

export interface SMSDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      config.sms.twilio.accountSid,
      config.sms.twilio.authToken
    );
  }

  /**
   * Send SMS notification
   */
  async sendSMS(input: SMSDeliveryInput): Promise<SMSDeliveryResult> {
    try {
      const from = input.from || config.sms.twilio.fromNumber;
      
      if (!from) {
        throw new Error('No SMS from number configured');
      }

      const message = await this.client.messages.create({
        body: input.content,
        from: from,
        to: input.to,
      });

      logger.info('SMS sent successfully', {
        to: input.to,
        messageId: message.sid,
        status: message.status,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      logger.error('Failed to send SMS', {
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
  async getMessageStatus(messageId: string): Promise<string | null> {
    try {
      const message = await this.client.messages(messageId).fetch();
      return message.status;
    } catch (error) {
      logger.error('Failed to get SMS status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId,
      });
      return null;
    }
  }

  /**
   * Send test SMS
   */
  async sendTestSMS(to: string): Promise<SMSDeliveryResult> {
    return this.sendSMS({
      to,
      content: `VoxLink SMS Service Test - ${new Date().toISOString()}`,
    });
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phoneNumber: string, countryCode = '+1'): string {
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