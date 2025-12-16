export interface EmailDeliveryInput {
    to: string;
    subject: string;
    content: string;
    from?: {
        name: string;
        address: string;
    };
}
export interface EmailDeliveryResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export declare class EmailService {
    private transporter;
    constructor();
    /**
     * Send email notification
     */
    sendEmail(input: EmailDeliveryInput): Promise<EmailDeliveryResult>;
    /**
     * Verify email configuration
     */
    verifyConnection(): Promise<boolean>;
    /**
     * Send test email
     */
    sendTestEmail(to: string): Promise<EmailDeliveryResult>;
}
