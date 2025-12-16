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
export declare class SMSService {
    private client;
    constructor();
    /**
     * Send SMS notification
     */
    sendSMS(input: SMSDeliveryInput): Promise<SMSDeliveryResult>;
    /**
     * Get message status
     */
    getMessageStatus(messageId: string): Promise<string | null>;
    /**
     * Send test SMS
     */
    sendTestSMS(to: string): Promise<SMSDeliveryResult>;
    /**
     * Validate phone number format
     */
    validatePhoneNumber(phoneNumber: string): boolean;
    /**
     * Format phone number to E.164
     */
    formatPhoneNumber(phoneNumber: string, countryCode?: string): string;
}
