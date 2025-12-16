export interface WebhookDeliveryInput {
    url: string;
    payload: Record<string, any>;
    secret?: string;
    headers?: Record<string, string>;
    retries?: number;
}
export interface WebhookDeliveryResult {
    success: boolean;
    statusCode?: number;
    responseBody?: string;
    error?: string;
}
export declare class WebhookService {
    /**
     * Send webhook notification
     */
    sendWebhook(input: WebhookDeliveryInput): Promise<WebhookDeliveryResult>;
    /**
     * Send webhook with retry logic
     */
    sendWebhookWithRetry(input: WebhookDeliveryInput): Promise<WebhookDeliveryResult>;
    /**
     * Generate HMAC signature for webhook payload
     */
    private generateSignature;
    /**
     * Verify webhook signature
     */
    verifySignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Test webhook endpoint
     */
    testWebhook(url: string, secret?: string): Promise<WebhookDeliveryResult>;
}
